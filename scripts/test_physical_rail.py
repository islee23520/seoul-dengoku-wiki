"""Physical rail regressions use explicit synthetic geometry, never route inventions."""
import pytest
from copy import deepcopy
from dataclasses import replace
from shapely.geometry import Point, LineString
from shapely.geometry import Polygon, box

from physical_rail import (AdjacentPair, EdgeWitness, NodeId, RailEvidenceError,
                           RailProof, RailWay, StationId, StopCandidates, CandidateWays,
                           SubpathWitness, MultiwayWitness, WaySegment, checked_bytes,
                           classify_pair, clip_way, multiway_routes, seoul_boundary,
                           verified_edge, verified_multiway, verified_subpath)
from physical_rail import (ROOT, INVENTORY_SHA, PhysicalWitnessProduct, consume_existence_product,
                           load_witness_sources, physical_connection, private_existence_product)


def multiway_fixture() -> tuple[MultiwayWitness, dict[int, RailWay], dict[int, str], RailProof]:
    pair = AdjacentPair(line_id="2", codes=("a", "b"), station_ids=(StationId("A"), StationId("B")))
    ways = {7: RailWay(osm_way=7, mode="subway", node_ids=(NodeId(1), NodeId(2), NodeId(3)),
                       points=((1, 1), (2, 1), (3, 1))),
            8: RailWay(osm_way=8, mode="subway", node_ids=(NodeId(5), NodeId(3), NodeId(4)),
                       points=((3, 2), (3, 1), (4, 1)))}
    witness = MultiwayWitness(pair=pair, station_nodes=(NodeId(1), NodeId(4)), segments=(
        WaySegment(osm_way=7, indices=(0, 2), node_ids=(NodeId(1), NodeId(2), NodeId(3))),
        WaySegment(osm_way=8, indices=(1, 2), node_ids=(NodeId(3), NodeId(4)))))
    proof = RailProof((pair,), ((StationId("A"), NodeId(1)), (StationId("B"), NodeId(4))))
    return witness, ways, {7: "2호선", 8: "2호선"}, proof


def test_multiway_proves_exact_shared_node_and_reversed_way_interval() -> None:
    witness, ways, names, proof = multiway_fixture()
    reversed_part = WaySegment(osm_way=8, indices=(1, 0), node_ids=(NodeId(3), NodeId(5)))
    reversed_witness = witness.model_copy(update={"station_nodes": (NodeId(1), NodeId(5)),
        "segments": (witness.segments[0], reversed_part)})
    reversed_proof = RailProof((witness.pair,), ((StationId("A"), NodeId(1)), (StationId("B"), NodeId(5))))
    assert verified_multiway(witness, ways, names, "2호선", proof, box(0, 0, 5, 5)) == witness
    assert verified_multiway(reversed_witness, ways, names, "2호선", reversed_proof, box(0, 0, 5, 5)) == reversed_witness


@pytest.mark.parametrize("mutation,expected", [
    ("unknown", "E_RAIL_MULTIWAY_WAY_EVIDENCE"),
    ("disconnected", "E_RAIL_MULTIWAY_CHAIN"),
    ("crossing", "E_RAIL_MULTIWAY_CHAIN"),
    ("gap", "E_RAIL_MULTIWAY_CHAIN"),
    ("wrong-binding", "E_RAIL_STATION_BINDING_EVIDENCE"),
    ("wrong-pair", "E_RAIL_ORIGINAL_ADJACENCY"),
    ("substring", "E_RAIL_MULTIWAY_WAY_EVIDENCE"),
    ("outside", "E_RAIL_OUTSIDE_DETOUR"),
    ("repeated", "E_RAIL_MULTIWAY_CHAIN"),
])
def test_multiway_rejects_unproven_chain(mutation: str, expected: str) -> None:
    witness, ways, names, proof = multiway_fixture()
    parts = list(witness.segments)
    if mutation == "unknown":
        parts[1] = parts[1].model_copy(update={"osm_way": 99})
    elif mutation == "disconnected":
        ways[8] = ways[8].model_copy(update={"node_ids": (NodeId(5), NodeId(9), NodeId(4))})
    elif mutation == "crossing":
        ways[8] = ways[8].model_copy(update={"node_ids": (NodeId(5), NodeId(9), NodeId(4)),
                                        "points": ((3, 2), (3, 1), (4, 1))})
    elif mutation == "gap":
        parts[0] = parts[0].model_copy(update={"node_ids": (NodeId(1), NodeId(3))})
    elif mutation == "wrong-binding":
        proof = RailProof((witness.pair,), ((StationId("A"), NodeId(9)), (StationId("B"), NodeId(4))))
    elif mutation == "wrong-pair":
        proof = RailProof((), proof.station_nodes)
    elif mutation == "substring":
        names[8] = "12호선"
    elif mutation == "outside":
        ways[8] = ways[8].model_copy(update={"points": ((3, 2), (6, 1), (4, 1))})
    elif mutation == "repeated":
        parts[0] = parts[0].model_copy(update={"node_ids": (NodeId(1), NodeId(1), NodeId(3))})
    witness = witness.model_copy(update={"segments": tuple(parts)})
    with pytest.raises(RailEvidenceError, match=expected):
        verified_multiway(witness, ways, names, "2호선", proof, box(0, 0, 5, 5))


def test_multiway_classifier_withholds_parallel_routes_and_accepts_unique_route() -> None:
    witness, ways, names, _ = multiway_fixture()
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(1), "A", "1")], "b": [(NodeId(4), "B", "4")]})
    tracks = CandidateWays({NodeId(1), NodeId(4)}, box(0, 0, 5, 5))
    tracks.ways.update(ways)
    tracks.names.update(names)
    tracks.incident[NodeId(1)].add(7)
    tracks.incident[NodeId(4)].add(8)
    original = {frozenset(witness.pair.station_ids)}
    result = classify_pair(witness.pair, "2호선", stops, tracks, box(0, 0, 5, 5), original)
    assert result["status"] == "bounded-multiway-candidate"
    assert result["searchBoundWays"] == 4
    assert result["routeUniquenessProven"] is False
    assert result["searchIncomplete"] is False
    assert result["witness"]["segments"] == [
        {"osmWay": 7, "indices": [0, 2], "orderedOsmNodeIds": [1, 2, 3]},
        {"osmWay": 8, "indices": [1, 2], "orderedOsmNodeIds": [3, 4]}]
    tracks.ways[9] = RailWay(osm_way=9, mode="subway", node_ids=(NodeId(1), NodeId(6), NodeId(3)),
                             points=((1, 1), (2, 2), (3, 1)))
    tracks.names[9] = "2호선"
    tracks.incident[NodeId(1)].add(9)
    assert classify_pair(witness.pair, "2호선", stops, tracks, box(0, 0, 5, 5), original)["status"] == "ambiguous"
    assert multiway_routes(witness.pair, "2호선", stops.by_code["a"], stops.by_code["b"], tracks,
                           box(0, 0, 5, 5), set()) == ([], False)


def test_multiway_reports_bound_without_claiming_unique_route() -> None:
    witness, ways, names, _ = multiway_fixture()
    ways[8] = RailWay(osm_way=8, mode="subway", node_ids=(NodeId(5), NodeId(3), NodeId(6)),
                      points=((3, 2), (3, 1), (3.5, 1)))
    ways[9] = RailWay(osm_way=9, mode="subway", node_ids=(NodeId(6), NodeId(7)),
                      points=((3.5, 1), (4, 1)))
    ways[10] = RailWay(osm_way=10, mode="subway", node_ids=(NodeId(7), NodeId(4)),
                       points=((4, 1), (4.5, 1)))
    names.update({9: "2호선", 10: "2호선"})
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(1), "A", "1")], "b": [(NodeId(4), "B", "4")]})
    tracks = CandidateWays({NodeId(1), NodeId(4)}, box(0, 0, 5, 5))
    tracks.ways.update(ways)
    tracks.names.update(names)
    tracks.incident[NodeId(1)].add(7)
    tracks.incident[NodeId(4)].add(10)
    original = {frozenset(witness.pair.station_ids)}
    assert multiway_routes(witness.pair, "2호선", stops.by_code["a"], stops.by_code["b"],
                           tracks, box(0, 0, 5, 5), original, max_ways=3) == ([], True)
    result = classify_pair(witness.pair, "2호선", stops, tracks, box(0, 0, 5, 5), original)
    assert result["status"] == "bounded-multiway-candidate"
    assert result["routeUniquenessProven"] is False


def test_multiway_validator_rejects_global_cycle_across_distinct_ways() -> None:
    witness, ways, names, proof = multiway_fixture()
    ways[8] = RailWay(osm_way=8, mode="subway", node_ids=(NodeId(3), NodeId(5), NodeId(2)),
                      points=((3, 1), (3, 2), (2, 1)))
    ways[9] = RailWay(osm_way=9, mode="subway", node_ids=(NodeId(2), NodeId(4)),
                      points=((2, 1), (4, 1)))
    names[9] = "2호선"
    cycle = witness.model_copy(update={"segments": (witness.segments[0],
        WaySegment(osm_way=8, indices=(0, 2), node_ids=(NodeId(3), NodeId(5), NodeId(2))),
        WaySegment(osm_way=9, indices=(0, 1), node_ids=(NodeId(2), NodeId(4))))})
    with pytest.raises(RailEvidenceError, match="E_RAIL_MULTIWAY_CHAIN"):
        verified_multiway(cycle, ways, names, "2호선", proof, box(0, 0, 5, 5))


def subpath_fixture(start: int = 0, end: int = 3) -> tuple[RailWay, AdjacentPair, RailProof, SubpathWitness]:
    way = RailWay(osm_way=7, mode="subway", node_ids=(NodeId(1), NodeId(2), NodeId(3), NodeId(4)),
                  points=((1, 1), (2, 1), (3, 1), (4, 1)))
    pair = AdjacentPair(line_id="2", codes=("a", "b"), station_ids=(StationId("A"), StationId("B")))
    indices = range(start, end + (1 if start < end else -1), 1 if start < end else -1)
    witness = SubpathWitness(pair=pair, osm_way=7, station_nodes=(way.node_ids[start], way.node_ids[end]),
                             indices=(start, end), node_ids=tuple(way.node_ids[i] for i in indices))
    proof = RailProof((pair,), ((StationId("A"), way.node_ids[start]), (StationId("B"), way.node_ids[end])))
    return way, pair, proof, witness


@pytest.mark.parametrize("start,end", [(0, 3), (1, 2), (3, 1)])
def test_subpath_preserves_exact_ordered_nodes_when_whole_internal_or_reversed(start: int, end: int) -> None:
    # Given
    way, _, proof, witness = subpath_fixture(start, end)
    # When
    result = verified_subpath(witness, way, proof, box(0, 0, 5, 5))
    # Then
    assert result == witness


def test_subpath_rejects_wrong_station_binding() -> None:
    # Given
    way, pair, proof, witness = subpath_fixture()
    wrong = SubpathWitness(pair=pair, osm_way=7, station_nodes=(NodeId(9), NodeId(4)), indices=(0, 3), node_ids=witness.node_ids)
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_STATION_BINDING_EVIDENCE"):
        verified_subpath(wrong, way, proof, box(0, 0, 5, 5))


def test_subpath_rejects_nonadjacent_official_pair() -> None:
    # Given
    way, _, proof, witness = subpath_fixture()
    wrong = SubpathWitness(pair=AdjacentPair(line_id="2", codes=("a", "c"), station_ids=(StationId("A"), StationId("C"))),
                           osm_way=7, station_nodes=witness.station_nodes, indices=witness.indices,
                           node_ids=witness.node_ids)
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_ORIGINAL_ADJACENCY"):
        verified_subpath(wrong, way, proof, box(0, 0, 5, 5))


def test_subpath_rejects_repeated_ambiguous_stop_node() -> None:
    # Given
    way, _, proof, witness = subpath_fixture()
    repeated = RailWay(osm_way=7, mode="subway", node_ids=(NodeId(1), NodeId(2), NodeId(1), NodeId(4)), points=way.points)
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_STATION_NODE_EVIDENCE"):
        verified_subpath(witness, repeated, proof, box(0, 0, 5, 5))


def test_subpath_rejects_exterior_middle_segment() -> None:
    # Given
    way, _, proof, witness = subpath_fixture()
    detour = RailWay(osm_way=7, mode="subway", node_ids=way.node_ids,
                     points=((1, 1), (2, 1), (6, 1), (4, 1)))
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_OUTSIDE_DETOUR"):
        verified_subpath(witness, detour, proof, box(0, 0, 5, 5))


def test_subpath_rejects_gapped_node_chain() -> None:
    # Given
    way, pair, proof, _ = subpath_fixture()
    gap = SubpathWitness(pair=pair, osm_way=7, station_nodes=(NodeId(1), NodeId(4)),
                         indices=(0, 3), node_ids=(NodeId(1), NodeId(2), NodeId(4)))
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_STATION_NODE_EVIDENCE"):
        verified_subpath(gap, way, proof, box(0, 0, 5, 5))


def test_inside_way_keeps_original_station_ids_when_proven() -> None:
    # Given
    way = RailWay(osm_way=1, mode="subway", node_ids=(NodeId(1), NodeId(2), NodeId(3)), points=((1, 1), (2, 2), (3, 1)))
    pair = AdjacentPair(line_id="2", codes=("a", "b"), station_ids=(StationId("신촌"), StationId("신촌(지하)")))
    witness = EdgeWitness(pair=pair, osm_way=1, station_nodes=(NodeId(1), NodeId(3)))
    # When
    result = verified_edge(witness, way, RailProof((pair,), ((StationId("신촌"), NodeId(1)), (StationId("신촌(지하)"), NodeId(3)))), box(0, 0, 4, 4))
    # Then
    assert result.pair.station_ids == ("신촌", "신촌(지하)")


def test_detour_is_rejected_when_both_endpoints_are_inside() -> None:
    # Given
    way = RailWay(osm_way=1, mode="rail", node_ids=(NodeId(1), NodeId(2), NodeId(3)), points=((1, 1), (5, 1), (3, 2)))
    pair = AdjacentPair(line_id="2", codes=("a", "b"), station_ids=(StationId("A"), StationId("B")))
    witness = EdgeWitness(pair=pair, osm_way=1, station_nodes=(NodeId(1), NodeId(3)))
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_OUTSIDE_DETOUR"):
        verified_edge(witness, way, RailProof((pair,), ((StationId("A"), NodeId(1)), (StationId("B"), NodeId(3)))), box(0, 0, 4, 4))


def test_reentry_retains_separate_pieces_when_middle_is_outside() -> None:
    # Given
    way = RailWay(osm_way=1, mode="rail", node_ids=(NodeId(1), NodeId(2), NodeId(3)), points=((1, 1), (5, 1), (3, 2)))
    # When
    pieces = clip_way(way, box(0, 0, 4, 4))
    # Then
    assert len(pieces) == 2
    assert pieces[0].points == ((1, 1), (4, 1))
    assert pieces[1].points == ((4, 1.5), (3, 2))


def test_shortcut_is_rejected_when_pair_was_not_originally_adjacent() -> None:
    # Given
    way = RailWay(osm_way=1, mode="rail", node_ids=(NodeId(1), NodeId(3)), points=((1, 1), (3, 2)))
    pair = AdjacentPair(line_id="2", codes=("a", "c"), station_ids=(StationId("A"), StationId("C")))
    witness = EdgeWitness(pair=pair, osm_way=1, station_nodes=(NodeId(1), NodeId(3)))
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_ORIGINAL_ADJACENCY"):
        verified_edge(witness, way, RailProof((), ()), box(0, 0, 4, 4))


def test_binding_is_rejected_when_way_nodes_do_not_prove_station_endpoints() -> None:
    # Given
    way = RailWay(osm_way=1, mode="rail", node_ids=(NodeId(1), NodeId(2)), points=((1, 1), (3, 2)))
    pair = AdjacentPair(line_id="2", codes=("a", "b"), station_ids=(StationId("A"), StationId("B")))
    witness = EdgeWitness(pair=pair, osm_way=1, station_nodes=(NodeId(9), NodeId(10)))
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_STATION_BINDING_EVIDENCE"):
        verified_edge(witness, way, RailProof((pair,), ()), box(0, 0, 4, 4))


def test_pinned_seoul_boundary_is_loaded_from_actual_city_feature() -> None:
    # Given / When
    boundary = seoul_boundary()
    # Then
    assert boundary.is_valid
    assert boundary.bounds[0] > 126
    assert boundary.bounds[2] < 128


def test_hole_keeps_two_parts_when_original_segment_crosses_excluded_land() -> None:
    # Given
    boundary = Polygon([(0, 0), (8, 0), (8, 8), (0, 8)], holes=[[(3, 3), (5, 3), (5, 5), (3, 5)]])
    way = RailWay(osm_way=7, mode="rail", node_ids=(NodeId(1), NodeId(2)), points=((1, 4), (7, 4)))
    # When
    pieces = clip_way(way, boundary)
    # Then
    assert [piece.points for piece in pieces] == [((1, 4), (3, 4)), ((5, 4), (7, 4))]


def test_missing_geometry_is_rejected_when_only_endpoint_ids_are_supplied() -> None:
    # Given
    way = RailWay(osm_way=1, mode="rail", node_ids=(NodeId(1), NodeId(2)), points=())
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_WAY_EVIDENCE"):
        clip_way(way, box(0, 0, 4, 4))


def test_private_classifier_accepts_exact_named_coded_inside_subpath() -> None:
    # Given
    way, pair, _, _ = subpath_fixture(1, 2)
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(2), "A", "2")], "b": [(NodeId(3), "B", "3")]})
    tracks = CandidateWays({NodeId(2), NodeId(3)})
    tracks.ways[7] = way
    tracks.names[7] = "2호선"
    tracks.incident[NodeId(2)].add(7)
    tracks.incident[NodeId(3)].add(7)
    # When
    result = classify_pair(pair, "2호선", stops, tracks, box(0, 0, 5, 5))
    # Then
    assert result["status"] == "verified"
    assert result["witness"] == {"osmWay": 7, "stopNodes": [2, 3], "stopRefs": ["2", "3"],
                                 "bindingEvidence": "exact-name-and-named-line-with-ref-recorded",
                                 "indices": [1, 2], "orderedOsmNodeIds": [2, 3]}


@pytest.mark.parametrize("expected,observed", [("2호선", "3호선"), ("1호선", "11호선"), ("2호선", "12호선")])
def test_private_classifier_withholds_name_or_line_mismatch(expected: str, observed: str) -> None:
    # Given
    way, pair, _, _ = subpath_fixture()
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(1), "A", "1")], "b": [(NodeId(4), "B", "4")]})
    tracks = CandidateWays({NodeId(1), NodeId(4)})
    tracks.ways[7] = way
    tracks.names[7] = observed
    tracks.incident[NodeId(1)].add(7)
    tracks.incident[NodeId(4)].add(7)
    # When
    result = classify_pair(pair, expected, stops, tracks, box(0, 0, 5, 5))
    # Then
    assert result["status"] == "multiwaygap"
    assert result["reason"] == "shared-way-but-line-or-subpath-unproven"


def test_private_classifier_records_ref_mismatch_when_named_line_proves_subpath() -> None:
    # Given
    way, pair, _, _ = subpath_fixture()
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(1), "A", "101")], "b": [(NodeId(4), "B", "204")]})
    tracks = CandidateWays({NodeId(1), NodeId(4)})
    tracks.ways[7] = way
    tracks.names[7] = "2호선"
    for node in tracks.incident.values():
        node.add(7)
    # When
    result = classify_pair(pair, "2호선", stops, tracks, box(0, 0, 5, 5))
    # Then
    assert result["status"] == "verified"
    assert result["witness"] == {"osmWay": 7, "stopNodes": [1, 4], "stopRefs": ["101", "204"],
                                 "bindingEvidence": "exact-name-and-named-line-with-ref-recorded",
                                 "indices": [0, 3], "orderedOsmNodeIds": [1, 2, 3, 4]}


def test_private_classifier_does_not_promote_hotel_without_rail_stop() -> None:
    # Given
    way, pair, _, _ = subpath_fixture()
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(1), "A", "1")], "b": []})
    tracks = CandidateWays({NodeId(1)})
    tracks.ways[7] = way
    tracks.names[7] = "2호선"
    tracks.incident[NodeId(1)].add(7)
    # When
    result = classify_pair(pair, "2호선", stops, tracks, box(0, 0, 5, 5))
    # Then
    assert result["status"] == "missing"
    assert result["candidateCounts"] == [1, 0]


def test_private_classifier_withholds_multiple_inside_witnesses() -> None:
    # Given
    way, pair, _, _ = subpath_fixture()
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(1), "A", "1"), (NodeId(2), "A", "1")],
                          "b": [(NodeId(4), "B", "4")]})
    tracks = CandidateWays({NodeId(1), NodeId(2), NodeId(4)})
    tracks.ways[7] = way
    tracks.names[7] = "2호선"
    for node in tracks.incident.values():
        node.add(7)
    # When
    result = classify_pair(pair, "2호선", stops, tracks, box(0, 0, 5, 5))
    # Then
    assert result["status"] == "ambiguous"


def test_private_classifier_withholds_external_route_even_when_stops_inside() -> None:
    # Given
    way, pair, _, _ = subpath_fixture()
    outside = RailWay(osm_way=7, mode="subway", node_ids=way.node_ids,
                      points=((1, 1), (2, 1), (6, 1), (4, 1)))
    stops = StopCandidates({"a": {"A"}, "b": {"B"}}, box(0, 0, 5, 5))
    stops.by_code.update({"a": [(NodeId(1), "A", "1")], "b": [(NodeId(4), "B", "4")]})
    tracks = CandidateWays({NodeId(1), NodeId(4)})
    tracks.ways[7] = outside
    tracks.names[7] = "2호선"
    for node in tracks.incident.values():
        node.add(7)
    # When
    result = classify_pair(pair, "2호선", stops, tracks, box(0, 0, 5, 5))
    # Then
    assert result["status"] == "multiwaygap"


def test_pinned_input_rejects_changed_source_hash(tmp_path) -> None:
    # Given
    changed = tmp_path / "official.json"
    changed.write_bytes(b"different")
    # When / Then
    with pytest.raises(RailEvidenceError, match="E_RAIL_SOURCE_HASH"):
        checked_bytes(changed, "0" * 64)


@pytest.fixture(scope="module")
def actual_witness_sources():
    return load_witness_sources()


def test_actual_pbf_product_consumes_33_exact_connections_without_selecting_routes(actual_witness_sources) -> None:
    sources = actual_witness_sources
    product = private_existence_product(sources)
    restored = PhysicalWitnessProduct.model_validate_json(product.model_dump_json())
    edges = consume_existence_product(restored, sources)
    assert len(edges) == 33
    assert sum(len(edge.segments) == 1 for edge in edges) == 28
    assert sum(len(edge.segments) > 1 for edge in edges) == 5
    assert product.record_count == 392
    assert product.unique_station_pairs == 383
    assert product.original_adjacency_matches == 381
    assert product.residual_status_counts == {"ambiguous": 231, "missing": 8, "multiwaygap": 120}
    assert len(product.residual_records) + len(edges) == product.record_count
    for edge in edges:
        assert edge.physical_existence == "witnessed"
        assert edge.route_uniqueness_proven is False
        assert edge.selected_game_travel_route is None
        assert edge.alternatives == "unknown"
        assert edge.passage2126 == "unknown"
        assert sources.boundary.covers(LineString(edge.points))
        assert len(edge.points) == sum(len(part.node_ids) for part in edge.segments) - len(edge.segments) + 1
    incomplete = [edge.pair.station_ids for edge in edges if edge.search_incomplete]
    assert incomplete == [("강변", "잠실나루")]
    wangsimni = next(edge for edge in edges if edge.pair.codes == ("0208", "0209"))
    assert [part.osm_way for part in wangsimni.segments] == [168498720, 628671359, 625534096]
    assert [part.node_ids[-1] for part in wangsimni.segments[:-1]] == [5935554446, 355172997]


@pytest.mark.parametrize("mutation,expected", [
    ("nonadjacent", "E_RAIL_ORIGINAL_ADJACENCY"),
    ("wrong-line", "E_RAIL_ORIGINAL_ADJACENCY"),
    ("wrong-station", "E_RAIL_ORIGINAL_ADJACENCY"),
    ("bad-node-join", "E_RAIL_MULTIWAY_CHAIN"),
    ("wrong-stop", "E_RAIL_STATION_BINDING_EVIDENCE"),
    ("source-ambiguity", "E_RAIL_SOURCE_AMBIGUITY"),
    ("unique-claim", "E_RAIL_EXISTENCE_ONLY"),
    ("outside-crossing", "E_RAIL_OUTSIDE_DETOUR"),
])
def test_actual_pbf_connection_rejects_unproved_inputs(actual_witness_sources, mutation, expected) -> None:
    sources = actual_witness_sources
    row = deepcopy(next(row for row in sources.inventory["records"] if row["codes"] == ["0208", "0209"]))
    if mutation == "nonadjacent":
        row["codes"] = ["0208", "0210"]
    elif mutation == "wrong-line":
        row["lineId"] = "5-4"
    elif mutation == "wrong-station":
        row["stationIds"][1] = "강변"
    elif mutation == "bad-node-join":
        row["witness"]["segments"][1]["orderedOsmNodeIds"][0] += 1
    elif mutation == "wrong-stop":
        row["witness"]["stopNodes"][0] += 1
    elif mutation == "source-ambiguity":
        official = deepcopy(sources.official)
        line = deepcopy(next(line for line in official["lines"] if line["id"] == "3-2"))
        line["name"] = "12호선"
        official["lines"].append(line)
        sources = replace(sources, official=official)
    elif mutation == "unique-claim":
        row["routeUniquenessProven"] = True
    elif mutation == "outside-crossing":
        # Actual PBF way leaves Seoul between two inside 9-line stops.
        way = sources.tracks.ways[551412128]
        points = way.points[31:53]
        assert all(sources.boundary.covers(Point(point)) for point in (points[0], points[-1]))
        assert not sources.boundary.covers(LineString(points))
        row = {"lineId": "10-9", "codes": ["4137", "4138"],
               "stationIds": ["둔촌오륜", "중앙보훈병원"], "status": "verified", "searchBoundWays": 4,
               "witness": {"osmWay": 551412128, "indices": [31, 52],
                           "orderedOsmNodeIds": list(way.node_ids[31:53]),
                           "stopNodes": [6102706369, 6102706367], "stopRefs": ["", ""]}}
    with pytest.raises(RailEvidenceError, match=expected):
        physical_connection(row, sources)


def test_actual_product_consumer_rejects_changed_geometry_hash_and_missing_witness(actual_witness_sources) -> None:
    sources = actual_witness_sources
    product = private_existence_product(sources)
    for changed in (
        product.model_copy(update={"edges": ()}),
        product.model_copy(update={"source_sha256": product.source_sha256 | {"osm": "0" * 64}}),
        product.model_copy(update={"edges": (product.edges[0].model_copy(update={"points": product.edges[0].points[::2]}),)
                                  + product.edges[1:]}),
    ):
        with pytest.raises(RailEvidenceError, match="E_RAIL_PRODUCT_EVIDENCE"):
            consume_existence_product(changed, sources)
    with pytest.raises(RailEvidenceError, match="E_RAIL_SOURCE_HASH"):
        checked_bytes(ROOT / ".omo/private/seoul-migration/physical-rail-multiway-witness-20261015/independent.json",
                      INVENTORY_SHA)


def test_actual_product_rejects_duplicate_or_lost_source_record(actual_witness_sources) -> None:
    inventory = deepcopy(actual_witness_sources.inventory)
    inventory["records"][1] = deepcopy(inventory["records"][0])
    with pytest.raises(RailEvidenceError, match="E_RAIL_RECEIPT_COUNTS"):
        private_existence_product(replace(actual_witness_sources, inventory=inventory))
