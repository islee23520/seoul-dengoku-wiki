Tier: HEAVY (behavioral route APIs plus independent Unity evidence and two owned commits).

RED: RouteDomain PreviewJourney mutation returned an empty preview. Unity filter `Janseon.Tests.EditMode.RouteTraversalTests.SurfaceToSubwayJourney` produced `SurfaceToSubwayJourney` result=Failed, Expected=3, But was=0; evidence: RED-happy.xml and RED-happy.txt.
GREEN happy: Unity filter `Janseon.Tests.EditMode.RouteTraversalTests.SurfaceToSubwayJourney`; result=Passed total=1 passed=1 failed=0; evidence: GREEN-happy.xml.
GREEN failure preservation: Unity filter `Janseon.Tests.EditMode.RouteTraversalTests.RouteBlockedAfterPreviewLeavesStateUnchanged`; result=Passed total=1 passed=1 failed=0; evidence: GREEN-failure.xml.
PLACEIDENTITY: environment `JANSEON_PLACE_ID_QA_OUTPUT=.../place-id.json TASK02_RUN_NONCE=task06-lastmile`; Unity filter `Janseon.Foundation.Tests.PlaceIdentityTests`; result=Passed total=14 passed=14 failed=0; evidence: GREEN-placeidentity.xml.
Cleanup: removed misplaced GAME/evidence/layered-full3d-16x9-20260920T063824Z and confirmed ENOENT; receipt: cleanup.json.
