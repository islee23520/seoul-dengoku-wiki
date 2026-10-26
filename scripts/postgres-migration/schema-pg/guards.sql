-- guards.sql — 불변 가드 트리거 (데이터 적재 후 설치)
-- 생성물: scripts/postgres-migration/ddl-convert.mjs (기계 변환, 수동 편집 금지)
-- source_sha256: a3c3edc3d73c4a2248963259e08fe4da2108fc82703079af0ed28dcc4b53a365
-- code_commit: 6fa06df69a7cdbd38fd6612c6800bb6d6a313f34
-- 계약: SQLite 트리거를 plpgsql 가드 함수로 기계 변환한다. COPY 간섭을 피하기 위해 적재 후 설치한다.

SET ROLE wiki_owner;
CREATE FUNCTION wiki."guard_current_region_disposition_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "current_region_disposition_no_update" BEFORE UPDATE ON wiki."current_region_disposition"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_current_region_disposition_no_update"();
CREATE FUNCTION wiki."guard_current_region_disposition_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "current_region_disposition_no_delete" BEFORE DELETE ON wiki."current_region_disposition"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_current_region_disposition_no_delete"();
CREATE FUNCTION wiki."guard_current_right_retirement_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "current_right_retirement_no_update" BEFORE UPDATE ON wiki."current_right_retirement"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_current_right_retirement_no_update"();
CREATE FUNCTION wiki."guard_current_right_retirement_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "current_right_retirement_no_delete" BEFORE DELETE ON wiki."current_right_retirement"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_current_right_retirement_no_delete"();
CREATE FUNCTION wiki."guard_document_key_order_no_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_key_order_no_INSERT" BEFORE INSERT ON wiki."document_key_order"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_key_order_no_INSERT"();
CREATE FUNCTION wiki."guard_document_key_order_no_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_key_order_no_UPDATE" BEFORE UPDATE ON wiki."document_key_order"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_key_order_no_UPDATE"();
CREATE FUNCTION wiki."guard_document_key_order_no_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_key_order_no_DELETE" BEFORE DELETE ON wiki."document_key_order"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_key_order_no_DELETE"();
CREATE FUNCTION wiki."guard_document_node_identity_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_node_identity_no_update" BEFORE UPDATE ON wiki."document_node_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_node_identity_no_update"();
CREATE FUNCTION wiki."guard_document_node_identity_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_node_identity_no_delete" BEFORE DELETE ON wiki."document_node_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_node_identity_no_delete"();
CREATE FUNCTION wiki."guard_document_publication_admission_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_publication_admission_no_update" BEFORE UPDATE ON wiki."document_publication_admission"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_publication_admission_no_update"();
CREATE FUNCTION wiki."guard_document_publication_admission_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_publication_admission_no_delete" BEFORE DELETE ON wiki."document_publication_admission"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_publication_admission_no_delete"();
CREATE FUNCTION wiki."guard_document_publication_admission_insert"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (NOT EXISTS (   SELECT 1 FROM "document_head" h JOIN "document_revision" r USING(source_id,revision_id)   JOIN "document_revision_seal" z USING(revision_id)   JOIN "source_file" s USING(source_id) JOIN "text_document" d USING(source_id)   WHERE h.source_id=NEW.source_id AND h.revision_id=NEW.revision_id     AND r.semantic_sha256=NEW.semantic_sha256     AND r.algorithm='typed-envelope-v1' AND s.logical_path=NEW.source_path     AND s.sha256=NEW.source_sha256 AND d.corpus_kind='current'     AND d.status IN ('approved','draft')     AND NOT EXISTS(SELECT 1 FROM "excluded_source" e WHERE e.logical_path=s.logical_path) )) THEN
    RAISE EXCEPTION 'publication snapshot mismatch';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "document_publication_admission_insert" BEFORE INSERT ON wiki."document_publication_admission"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_publication_admission_insert"();
CREATE FUNCTION wiki."guard_document_revision_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_revision_no_update" BEFORE UPDATE ON wiki."document_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_revision_no_update"();
CREATE FUNCTION wiki."guard_document_revision_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_revision_no_delete" BEFORE DELETE ON wiki."document_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_revision_no_delete"();
CREATE FUNCTION wiki."guard_document_revision_link_target_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_revision_link_target_no_update" BEFORE UPDATE ON wiki."document_revision_link_target"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_revision_link_target_no_update"();
CREATE FUNCTION wiki."guard_document_revision_link_target_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_revision_link_target_no_delete" BEFORE DELETE ON wiki."document_revision_link_target"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_revision_link_target_no_delete"();
CREATE FUNCTION wiki."guard_document_revision_link_target_no_insert"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed link target history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "document_revision_link_target_no_insert" BEFORE INSERT ON wiki."document_revision_link_target"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_revision_link_target_no_insert"();
CREATE FUNCTION wiki."guard_document_revision_seal_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_revision_seal_no_update" BEFORE UPDATE ON wiki."document_revision_seal"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_revision_seal_no_update"();
CREATE FUNCTION wiki."guard_document_revision_seal_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_revision_seal_no_delete" BEFORE DELETE ON wiki."document_revision_seal"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_revision_seal_no_delete"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_affiliation"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_DELETE" BEFORE DELETE ON wiki."document_revision_text_affiliation"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_INSERT" BEFORE INSERT ON wiki."document_revision_text_affiliation"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_hegemon_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_hegemon_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_affiliation_hegemon"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_hegemon_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_hegemon_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_hegemon_DELETE" BEFORE DELETE ON wiki."document_revision_text_affiliation_hegemon"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_hegemon_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_hegemon_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_hegemon_INSERT" BEFORE INSERT ON wiki."document_revision_text_affiliation_hegemon"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_hegemon_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_member_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_member_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_affiliation_member"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_member_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_member_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_member_DELETE" BEFORE DELETE ON wiki."document_revision_text_affiliation_member"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_member_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_member_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_member_INSERT" BEFORE INSERT ON wiki."document_revision_text_affiliation_member"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_member_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_neutral_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_neutral_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_affiliation_neutral"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_neutral_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_neutral_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_neutral_DELETE" BEFORE DELETE ON wiki."document_revision_text_affiliation_neutral"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_neutral_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_neutral_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_neutral_INSERT" BEFORE INSERT ON wiki."document_revision_text_affiliation_neutral"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_neutral_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_state_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_state_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_affiliation_state"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_state_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_state_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_state_DELETE" BEFORE DELETE ON wiki."document_revision_text_affiliation_state"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_state_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_affiliation_state_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_affiliation_state_INSERT" BEFORE INSERT ON wiki."document_revision_text_affiliation_state"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_affiliation_state_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_ailments_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ailments_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_ailments_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ailments_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_ailments_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ailments_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_ailments_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ailments_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_ailments_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_ailments_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_ailments_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ailments_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_additional_people_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_additional_people_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_additional_people"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_additional_people_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_additional_people_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_additional_people_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_additional_people"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_additional_people_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_additional_people_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_additional_people_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_additional_people"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_additional_people_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_arcs"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_arcs"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_arcs"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_acts_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_acts_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_arcs_acts"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_acts_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_acts_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_acts_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_arcs_acts"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_acts_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_acts_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_acts_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_arcs_acts"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_acts_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_group_ids_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_group_ids_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_arcs_group_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_group_ids_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_group_ids_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_group_ids_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_arcs_group_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_group_ids_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_group_ids_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_group_ids_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_arcs_group_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_group_ids_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_house_ids_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_house_ids_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_arcs_house_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_house_ids_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_house_ids_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_house_ids_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_arcs_house_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_house_ids_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_house_ids_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_house_ids_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_arcs_house_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_house_ids_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_source_anchors_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_arcs_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_source_anchors_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_source_anchors_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_arcs_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_source_anchors_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_source_anchors_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_arcs_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_source_anchors_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_synthetic_classes_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_synthetic_classes_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_arcs_synthetic_classes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_synthetic_classes_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_synthetic_classes_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_synthetic_classes_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_arcs_synthetic_classes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_synthetic_classes_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_synthetic_classes_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_synthetic_classes_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_arcs_synthetic_classes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_synthetic_classes_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_theater_ids_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_theater_ids_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_arcs_theater_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_theater_ids_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_theater_ids_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_theater_ids_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_arcs_theater_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_theater_ids_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_arcs_theater_ids_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_arcs_theater_ids_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_arcs_theater_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_arcs_theater_ids_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_change_ledger_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_change_ledger_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_change_ledger"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_change_ledger_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_change_ledger_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_change_ledger_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_change_ledger"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_change_ledger_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_change_ledger_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_change_ledger_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_change_ledger"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_change_ledger_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_dependencies_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_dependencies_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_document_dependencies"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_dependencies_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_dependencies_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_dependencies_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_document_dependencies"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_dependencies_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_dependencies_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_dependencies_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_document_dependencies"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_dependencies_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_projection_targets_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_projection_targets_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_document_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_projection_targets_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_projection_targets_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_projection_targets_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_document_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_projection_targets_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_projection_targets_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_projection_targets_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_document_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_projection_targets_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_related_ids_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_related_ids_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_document_related_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_related_ids_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_related_ids_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_related_ids_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_document_related_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_related_ids_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_related_ids_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_related_ids_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_document_related_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_related_ids_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_source_anchors_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_document_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_source_anchors_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_source_anchors_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_document_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_source_anchors_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_document_source_anchors_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_document_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_document_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_document_source_anchors_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_dossier_prose_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_dossier_prose_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_dossier_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_dossier_prose_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_dossier_prose_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_dossier_prose_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_dossier_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_dossier_prose_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_dossier_prose_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_dossier_prose_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_dossier_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_dossier_prose_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_co_6c612d8a58c6"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_corporat_ffa8c86b3e1d" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_links_corporations_"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_co_6c612d8a58c6"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_co_461e45eb8bb4"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_corporat_9e55093f70c7" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_links_corporations_"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_co_461e45eb8bb4"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_co_9cfee8fcc86d"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_corporat_be28b4ac66fb" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_links_corporations_"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_co_9cfee8fcc86d"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_houses_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_houses_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_links_houses"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_houses_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_houses_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_houses_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_links_houses"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_houses_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_houses_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_houses_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_links_houses"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_houses_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_states_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_states_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_links_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_states_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_states_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_states_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_links_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_states_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_states_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_states_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_links_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_states_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_sy_fdf0ed9511be"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_synthetics_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_links_synthetics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_sy_fdf0ed9511be"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_sy_a575f85ab553"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_synthetics_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_links_synthetics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_sy_a575f85ab553"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_sy_a5bc840b73a3"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_synthetics_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_links_synthetics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_sy_a5bc840b73a3"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_theaters_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_theaters_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_links_theaters"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_theaters_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_theaters_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_theaters_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_links_theaters"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_theaters_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_theaters_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_links_theaters_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_links_theaters"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_links_theaters_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_projecti_971a8e565328"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_projection_targets_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_projecti_971a8e565328"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_projecti_42a9b06516c4"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_projection_targets_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_projecti_42a9b06516c4"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_projecti_690240954309"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_projection_targets_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_projecti_690240954309"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_prose_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_prose_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_prose_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_prose_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_prose_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_prose_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_prose_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_prose_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_prose_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_links_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_links_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_scenario_links"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_links_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_links_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_links_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_scenario_links"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_links_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_links_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_links_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_scenario_links"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_links_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_bdc288486e11"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outlines_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_bdc288486e11"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_afc5be6b0496"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outlines_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_afc5be6b0496"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_d85c9c906cfe"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outlines_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_d85c9c906cfe"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_2a1cd4bd31f0"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outli_e63bdf964dcb" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_a"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_2a1cd4bd31f0"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_1f3da1a63630"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outli_bcf05d392117" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_a"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_1f3da1a63630"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_7f7a675ba206"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outli_ab62e692837c" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_a"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_7f7a675ba206"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_5a6613aee15d"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outli_8c0960640571" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_c"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_5a6613aee15d"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_44a449cd778e"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outli_88755805a6b9" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_c"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_44a449cd778e"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_0be4bb27ea51"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenario_outli_ff926d737373" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_scenario_outlines_c"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenario_0be4bb27ea51"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenarios_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenarios_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_scenarios"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenarios_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenarios_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenarios_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_scenarios"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenarios_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenarios_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_scenarios_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_scenarios"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_scenarios_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_source_anchors_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_hostile_groups_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_source_anchors_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_source_anchors_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_hostile_groups_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_source_anchors_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_source_anchors_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_hostile_groups_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_hostile_groups_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_hostile_groups_source_anchors_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_a_c17249ab0c8b"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_authori_6097aaa9230d" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_ai_stewardship_authorized_f"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_a_c17249ab0c8b"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_a_56bbf92ce4c4"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_authori_cf43a0ad51c6" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_ai_stewardship_authorized_f"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_a_56bbf92ce4c4"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_a_d28033e45d12"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_authori_f47b9333f1ff" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_ai_stewardship_authorized_f"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_a_d28033e45d12"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_p_457e6cf273fc"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_prohibi_b934f17e1b29" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_ai_stewardship_prohibited_f"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_p_457e6cf273fc"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_p_9b6c89d48020"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_prohibi_39f25dcd74df" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_ai_stewardship_prohibited_f"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_p_9b6c89d48020"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_p_dde7e3d85497"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_prohibi_3fb541c005d4" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_ai_stewardship_prohibited_f"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_p_dde7e3d85497"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_s_7ac0e695b8fc"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_system_ids_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_ai_stewardship_system_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_s_7ac0e695b8fc"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_s_42b00f371c0e"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_system_ids_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_ai_stewardship_system_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_s_42b00f371c0e"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_s_8209da43c030"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_ai_stewardship_system_ids_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_ai_stewardship_system_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_ai_stewardship_s_8209da43c030"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_arcs_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_arcs_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_arcs"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_arcs_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_arcs_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_arcs_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_arcs"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_arcs_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_arcs_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_arcs_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_arcs"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_arcs_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_forbidde_18d37850fd72"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_charter_forbidden_powers_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_charter_forbidden_powers"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_forbidde_18d37850fd72"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_forbidde_536f8d9268cb"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_charter_forbidden_powers_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_charter_forbidden_powers"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_forbidde_536f8d9268cb"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_forbidde_3f537476d679"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_charter_forbidden_powers_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_charter_forbidden_powers"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_forbidde_3f537476d679"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_mandate__989dc73afe62"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_charter_mandate_domains_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_charter_mandate_domains"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_mandate__989dc73afe62"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_mandate__6f7562c6fad2"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_charter_mandate_domains_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_charter_mandate_domains"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_mandate__6f7562c6fad2"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_mandate__b4a53ccd0beb"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_charter_mandate_domains_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_charter_mandate_domains"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_charter_mandate__b4a53ccd0beb"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_classes_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_membership_classes_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_membership_classes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_classes_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_classes_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_membership_classes_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_membership_classes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_classes_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_classes_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_membership_classes_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_membership_classes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_classes_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_entry_5da4f6d5e8c7"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_membership_entry_routes_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_membership_entry_routes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_entry_5da4f6d5e8c7"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_entry_9c3ff1c3a6ec"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_membership_entry_routes_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_membership_entry_routes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_entry_9c3ff1c3a6ec"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_entry_ba394645bca7"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_membership_entry_routes_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_membership_entry_routes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_membership_entry_ba394645bca7"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_obligations_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_obligations_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_obligations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_obligations_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_obligations_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_obligations_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_obligations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_obligations_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_obligations_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_obligations_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_obligations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_obligations_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_projection_targets_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_projection_targets_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_projection_targets_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_projection_targets_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_projection_targets_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_projection_targets_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_projection_targets_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_projection_targets_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_projection_targets_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_prose_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_prose_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_prose_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_prose_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_prose_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_prose_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_prose_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_prose_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_prose_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_protected_guests_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_protected_guests_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_protected_guests"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_protected_guests_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_protected_guests_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_protected_guests_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_protected_guests"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_protected_guests_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_protected_guests_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_protected_guests_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_protected_guests"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_protected_guests_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_regency_triad_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_regency_triad_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_regency_triad"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_regency_triad_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_regency_triad_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_regency_triad_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_regency_triad"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_regency_triad_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_regency_triad_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_regency_triad_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_regency_triad"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_regency_triad_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_source_anchors_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_source_anchors_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_source_anchors_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_source_anchors_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_source_anchors_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_source_anchors_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_states_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_states_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_states_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_states_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_states_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_states_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_states_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_states_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_states_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_caret_3dd4a383aec3"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_succession_caretaker_triad_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_succession_caretaker_triad"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_caret_3dd4a383aec3"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_caret_327f509b1132"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_succession_caretaker_triad_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_succession_caretaker_triad"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_caret_327f509b1132"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_caret_440181571e5c"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_succession_caretaker_triad_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_succession_caretaker_triad"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_caret_440181571e5c"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_trigg_0d52c9f10e76"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_succession_trigger_events_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_houses_succession_trigger_events"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_trigg_0d52c9f10e76"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_trigg_5d383f1e85ed"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_succession_trigger_events_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_houses_succession_trigger_events"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_trigg_5d383f1e85ed"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_trigg_78caeca8863f"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_houses_succession_trigger_events_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_houses_succession_trigger_events"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_houses_succession_trigg_78caeca8863f"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_humans_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_humans_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_humans"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_humans_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_humans_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_humans_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_humans"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_humans_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_humans_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_humans_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_humans"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_humans_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_batches"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_batches"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_batches"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_entry_ids_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_entry_ids_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_batches_entry_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_entry_ids_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_entry_ids_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_entry_ids_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_batches_entry_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_entry_ids_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_entry_ids_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_entry_ids_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_batches_entry_ids"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_entry_ids_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_source__9d36b43b6de7"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_batches_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_source__9d36b43b6de7"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_source__9b24be89d442"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_batches_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_source__9b24be89d442"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_source__30180e6845ce"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_batches_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_batches_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_batches_source__30180e6845ce"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entries_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entries_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entries_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entries_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entries_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entries_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_28df21e30fbb"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_c57f8996c5e3" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries_links_hou"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_28df21e30fbb"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_b04565390cb7"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_a6d642d20043" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries_links_hou"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_b04565390cb7"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6d3ed90ded00"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_0ebf0f4a83b2" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries_links_hou"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6d3ed90ded00"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6c775370159e"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_9e0cc9ea6eec" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries_links_sce"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6c775370159e"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_f2874c7c3348"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_756a1c3b07f7" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries_links_sce"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_f2874c7c3348"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_481338cbc9a5"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_843e0b42e3ea" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries_links_sce"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_481338cbc9a5"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_eb2f496514fd"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_e0deb94898f2" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries_links_sta"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_eb2f496514fd"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_ca4a945c69d1"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_42c4c7623d51" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries_links_sta"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_ca4a945c69d1"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_8d7ac379a0ad"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_31b103d0f123" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries_links_sta"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_8d7ac379a0ad"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_f4597851f828"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_92c70bd01db9" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries_links_syn"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_f4597851f828"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6dd5558c8328"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_90ebf25483b1" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries_links_syn"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6dd5558c8328"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_4310dfcea9c9"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_74a3d7ef925f" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries_links_syn"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_4310dfcea9c9"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_f3ab44dcae11"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_796ac4b5f59e" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries_links_the"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_f3ab44dcae11"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_3ed9ac307530"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_15801aa54b94" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries_links_the"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_3ed9ac307530"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_2412ff1af1b7"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_link_b29557bcbb11" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries_links_the"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_2412ff1af1b7"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6ed5a5fac14e"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_prose_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_6ed5a5fac14e"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_9ae3d74c924b"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_prose_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_9ae3d74c924b"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_40bb29e0413f"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_prose_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_40bb29e0413f"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_1dd19f7bc522"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_pros_f85ff714c2a3" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_entries_prose_ite"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_1dd19f7bc522"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_7264240e8a9f"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_pros_c37389d5cd6f" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_entries_prose_ite"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_7264240e8a9f"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_16fd0e6210b2"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_entries_pros_d5b6ff741155" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_entries_prose_ite"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_entrie_16fd0e6210b2"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_source_52f8e4cae053"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_monster_contents_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_source_52f8e4cae053"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_source_1dacb1e8c4b6"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_monster_contents_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_source_1dacb1e8c4b6"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_source_a94cdd3db424"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_monster_contents_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_monster_contents_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_monster_contents_source_a94cdd3db424"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_projection_pages_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_projection_pages_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_projection_pages"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_projection_pages_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_projection_pages_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_projection_pages_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_projection_pages"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_projection_pages_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_projection_pages_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_projection_pages_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_projection_pages"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_projection_pages_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_relations_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_relations_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_relations_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_relations_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_relations_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_relations_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_relations_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_relations_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_relations_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_corridors_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_corridors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_states_corridors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_corridors_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_corridors_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_corridors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_states_corridors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_corridors_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_corridors_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_corridors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_states_corridors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_corridors_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_offices_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_offices_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_states_offices"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_offices_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_offices_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_offices_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_states_offices"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_offices_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_offices_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_offices_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_states_offices"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_offices_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_power_basis_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_power_basis_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_states_power_basis"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_power_basis_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_power_basis_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_power_basis_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_states_power_basis"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_power_basis_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_states_power_basis_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_states_power_basis_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_states_power_basis"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_states_power_basis_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_synthetics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_synthetics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_synthetics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_projection_targets_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_projection_targets_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_synthetics_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_projection_targets_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_projection_targets_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_projection_targets_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_synthetics_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_projection_targets_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_projection_targets_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_projection_targets_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_synthetics_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_projection_targets_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_prose_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_prose_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_synthetics_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_prose_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_prose_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_prose_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_synthetics_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_prose_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_prose_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_prose_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_synthetics_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_prose_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_relations_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_relations_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_synthetics_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_relations_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_relations_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_relations_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_synthetics_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_relations_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_relations_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_relations_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_synthetics_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_relations_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_source_anchors_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_synthetics_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_source_anchors_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_source_anchors_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_synthetics_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_source_anchors_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_synthetics_source_anchors_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_synthetics_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_synthetics_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_synthetics_source_anchors_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_checkpoints"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_checkpoints"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_checkpoints"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_au_f14e4b4ad4b3"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_authorit_5df6b9b6b163" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_checkpoints_authority_sta"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_au_f14e4b4ad4b3"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_au_bf737968dd60"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_authorit_135fa50f7959" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_checkpoints_authority_sta"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_au_bf737968dd60"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_au_b912c3c0f41a"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_authorit_e7574f8dc2f1" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_checkpoints_authority_sta"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_au_b912c3c0f41a"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_checks_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_checks_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_checkpoints_checks"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_checks_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_checks_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_checks_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_checkpoints_checks"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_checks_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_checks_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_checkpoints_checks_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_checkpoints_checks"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_checkpoints_checks_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_explicit_unknowns_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_explicit_unknowns_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_explicit_unknowns"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_explicit_unknowns_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_explicit_unknowns_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_explicit_unknowns_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_explicit_unknowns"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_explicit_unknowns_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_explicit_unknowns_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_explicit_unknowns_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_explicit_unknowns"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_explicit_unknowns_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_hostile_ecolog_9945f101481e"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_hostile_ecology_inte_e8ec4cac514b" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_hostile_ecology_interacti"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_hostile_ecolog_9945f101481e"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_hostile_ecolog_62403519a259"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_hostile_ecology_inte_bed42784c7d8" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_hostile_ecology_interacti"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_hostile_ecolog_62403519a259"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_hostile_ecolog_f8f35e18d12a"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_hostile_ecology_inte_e55e29faa266" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_hostile_ecology_interacti"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_hostile_ecolog_f8f35e18d12a"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_language_rumor_6db0ce87c11e"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_language_rumor_proto_35e7a87adf90" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_language_rumor_protocol_r"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_language_rumor_6db0ce87c11e"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_language_rumor_1e14135edd05"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_language_rumor_proto_9e56b119b202" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_language_rumor_protocol_r"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_language_rumor_1e14135edd05"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_language_rumor_bf7aa02ec27c"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_language_rumor_proto_cc5f0bc7127f" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_language_rumor_protocol_r"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_language_rumor_bf7aa02ec27c"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_player_entry_points_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_player_entry_points_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_player_entry_points"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_player_entry_points_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_player_entry_points_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_player_entry_points_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_player_entry_points"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_player_entry_points_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_player_entry_points_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_player_entry_points_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_player_entry_points"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_player_entry_points_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_projection_targets_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_projection_targets_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_projection_targets_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_projection_targets_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_projection_targets_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_projection_targets_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_projection_targets_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_projection_targets_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_projection_targets"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_projection_targets_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_prose"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_en_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_text_en_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_prose_text_en"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_en_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_en_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_text_en_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_prose_text_en"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_en_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_en_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_text_en_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_prose_text_en"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_en_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_ko_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_text_ko_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_prose_text_ko"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_ko_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_ko_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_text_ko_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_prose_text_ko"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_ko_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_ko_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_prose_text_ko_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_prose_text_ko"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_prose_text_ko_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_scenario_chains_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_scenario_chains_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_scenario_chains"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_scenario_chains_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_scenario_chains_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_scenario_chains_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_scenario_chains"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_scenario_chains_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_scenario_chains_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_scenario_chains_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_scenario_chains"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_scenario_chains_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_seoul_route_st_a36c6315f15c"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_seoul_route_staging_nodes_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_seoul_route_staging_nodes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_seoul_route_st_a36c6315f15c"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_seoul_route_st_c1f7d2c44a5a"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_seoul_route_staging_nodes_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_seoul_route_staging_nodes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_seoul_route_st_c1f7d2c44a5a"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_seoul_route_st_c8f9c1e1433c"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_seoul_route_staging_nodes_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_seoul_route_staging_nodes"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_seoul_route_st_c8f9c1e1433c"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_source_anchors_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_source_anchors_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_source_anchors_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_source_anchors_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_source_anchors_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_source_anchors_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_source_anchors_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_source_anchors_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_source_anchors"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_source_anchors_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_state_interests_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_state_interests_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_state_interests"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_state_interests_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_state_interests_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_state_interests_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_state_interests"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_state_interests_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_state_interests_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_state_interests_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_state_interests"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_state_interests_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_states_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_states_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_states_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_states_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_states_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_states_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_states_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_states_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_states"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_states_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_supply_chain_flows_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_supply_chain_flows_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_supply_chain_flows"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_supply_chain_flows_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_supply_chain_flows_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_supply_chain_flows_DELETE" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_supply_chain_flows"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_supply_chain_flows_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_supply_chain_flows_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_supply_chain_flows_INSERT" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_supply_chain_flows"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_supply_chain_flows_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_6699583bcae8"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_travel_constraints_s_58d3657ccf92" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_travel_constraints_season"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_6699583bcae8"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_7c81215ee1bf"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_travel_constraints_s_46834ebcccfc" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_travel_constraints_season"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_7c81215ee1bf"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_e5308ed1222a"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_travel_constraints_s_fb7c7531b3b6" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_travel_constraints_season"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_e5308ed1222a"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_237090b446d4"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_travel_constraints_s_6074d517a172" BEFORE UPDATE ON wiki."document_revision_text_atlas_theaters_travel_constraints_suspen"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_237090b446d4"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_00619897053c"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_travel_constraints_s_c03a5d6f40fb" BEFORE DELETE ON wiki."document_revision_text_atlas_theaters_travel_constraints_suspen"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_00619897053c"();
CREATE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_785fff468230"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_atlas_theaters_travel_constraints_s_55426c0227db" BEFORE INSERT ON wiki."document_revision_text_atlas_theaters_travel_constraints_suspen"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_atlas_theaters_travel_constra_785fff468230"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_desire_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_desire_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_desire"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_desire_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_desire_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_desire_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_desire"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_desire_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_desire_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_desire_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_desire"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_desire_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_fact_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_fact_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_fact"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_fact_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_fact_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_fact_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_fact"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_fact_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_fact_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_fact_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_fact"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_fact_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_identity_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_identity_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_identity_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_identity_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_identity_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_identity_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_identity_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_identity_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_identity_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_politics_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_politics_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_politics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_politics_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_politics_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_politics_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_politics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_politics_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_politics_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_politics_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_politics"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_politics_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_rank_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_rank_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_rank_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_rank_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_rank_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_rank_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_rank_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_rank_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_rank_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_relation_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_relation_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_relation"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_relation_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_relation_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_relation_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_relation"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_relation_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_relation_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_relation_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_relation"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_relation_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_relations_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_relations_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_relations_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_relations_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_relations_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_relations_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_relations_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_relations_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_relations_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_value_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_value_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_character_example_value"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_value_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_value_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_value_DELETE" BEFORE DELETE ON wiki."document_revision_text_character_example_value"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_value_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_character_example_value_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_character_example_value_INSERT" BEFORE INSERT ON wiki."document_revision_text_character_example_value"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_character_example_value_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_chronology_event_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_chronology_event_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_chronology_event"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_chronology_event_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_chronology_event_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_chronology_event_DELETE" BEFORE DELETE ON wiki."document_revision_text_chronology_event"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_chronology_event_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_chronology_event_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_chronology_event_INSERT" BEFORE INSERT ON wiki."document_revision_text_chronology_event"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_chronology_event_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_culture_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_culture_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_culture_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_culture_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_culture_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_culture_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_culture_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_culture_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_culture_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_culture_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_culture_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_culture_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_DELETE" BEFORE DELETE ON wiki."document_revision_text_document"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_INSERT" BEFORE INSERT ON wiki."document_revision_text_document"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_anchor_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_anchor_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_anchor"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_anchor_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_anchor_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_anchor_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_anchor"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_anchor_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_anchor_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_anchor_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_anchor"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_anchor_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_category_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_category_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_category"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_category_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_category_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_category_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_category"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_category_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_category_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_category_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_category"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_category_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_history_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_history_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_history"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_history_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_history_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_history_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_history"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_history_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_history_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_history_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_history"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_history_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_link_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_link_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_link"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_link_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_link_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_link_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_link"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_link_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_link_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_link_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_link"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_link_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_list_item_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_list_item_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_list_item"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_list_item_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_list_item_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_list_item_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_list_item"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_list_item_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_list_item_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_list_item_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_list_item"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_list_item_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_locale_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_locale_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_locale"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_locale_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_locale_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_locale_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_locale"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_locale_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_locale_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_locale_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_locale"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_locale_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_node_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_node_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_node"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_node_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_node_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_node_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_node"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_node_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_node_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_node_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_node"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_node_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_run_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_run_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_run"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_run_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_run_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_run_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_run"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_run_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_run_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_run_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_run"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_run_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_slot_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_slot_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_slot"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_slot_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_slot_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_slot_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_slot"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_slot_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_slot_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_slot_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_slot"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_slot_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_source_ref_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_source_ref_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_source_ref"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_source_ref_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_source_ref_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_source_ref_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_source_ref"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_source_ref_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_source_ref_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_source_ref_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_source_ref"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_source_ref_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_table_cell_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_table_cell_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_table_cell"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_table_cell_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_table_cell_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_table_cell_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_table_cell"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_table_cell_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_table_cell_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_table_cell_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_table_cell"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_table_cell_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_document_table_row_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_table_row_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_document_table_row"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_table_row_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_document_table_row_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_document_table_row_DELETE" BEFORE DELETE ON wiki."document_revision_text_document_table_row"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_table_row_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_document_table_row_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_document_table_row_INSERT" BEFORE INSERT ON wiki."document_revision_text_document_table_row"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_document_table_row_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_ecology"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_DELETE" BEFORE DELETE ON wiki."document_revision_text_ecology"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_INSERT" BEFORE INSERT ON wiki."document_revision_text_ecology"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_data_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_data_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_ecology_data"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_data_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_data_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_data_DELETE" BEFORE DELETE ON wiki."document_revision_text_ecology_data"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_data_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_data_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_data_INSERT" BEFORE INSERT ON wiki."document_revision_text_ecology_data"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_data_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_description_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_description_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_ecology_description"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_description_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_description_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_description_DELETE" BEFORE DELETE ON wiki."document_revision_text_ecology_description"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_description_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_description_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_description_INSERT" BEFORE INSERT ON wiki."document_revision_text_ecology_description"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_description_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_description_run_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_description_run_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_ecology_description_run"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_description_run_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_description_run_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_description_run_DELETE" BEFORE DELETE ON wiki."document_revision_text_ecology_description_run"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_description_run_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_description_run_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_description_run_INSERT" BEFORE INSERT ON wiki."document_revision_text_ecology_description_run"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_description_run_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_variant_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_variant_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_ecology_variant"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_variant_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_variant_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_variant_DELETE" BEFORE DELETE ON wiki."document_revision_text_ecology_variant"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_variant_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_ecology_variant_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_ecology_variant_INSERT" BEFORE INSERT ON wiki."document_revision_text_ecology_variant"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_ecology_variant_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_economy_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_economy_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_economy_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_economy_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_economy_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_economy_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_economy_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_economy_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_economy_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_economy_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_economy_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_economy_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_goods_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_goods_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_goods_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_goods_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_goods_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_goods_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_goods_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_goods_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_goods_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_goods_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_goods_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_goods_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_governance_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_governance_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_governance"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_governance_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_governance_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_governance_DELETE" BEFORE DELETE ON wiki."document_revision_text_governance"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_governance_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_governance_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_governance_INSERT" BEFORE INSERT ON wiki."document_revision_text_governance"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_governance_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_integration_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_integration_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_integration"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_integration_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_integration_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_integration_DELETE" BEFORE DELETE ON wiki."document_revision_text_integration"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_integration_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_integration_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_integration_INSERT" BEFORE INSERT ON wiki."document_revision_text_integration"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_integration_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_integration_excluded_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_integration_excluded_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_integration_excluded"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_integration_excluded_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_integration_excluded_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_integration_excluded_DELETE" BEFORE DELETE ON wiki."document_revision_text_integration_excluded"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_integration_excluded_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_integration_excluded_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_integration_excluded_INSERT" BEFORE INSERT ON wiki."document_revision_text_integration_excluded"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_integration_excluded_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_name_pool_example_entry_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_name_pool_example_entry_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_name_pool_example_entry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_name_pool_example_entry_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_name_pool_example_entry_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_name_pool_example_entry_DELETE" BEFORE DELETE ON wiki."document_revision_text_name_pool_example_entry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_name_pool_example_entry_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_name_pool_example_entry_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_name_pool_example_entry_INSERT" BEFORE INSERT ON wiki."document_revision_text_name_pool_example_entry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_name_pool_example_entry_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_offices_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_offices_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_offices_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_offices_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_offices_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_offices_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_offices_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_offices_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_offices_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_offices_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_offices_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_offices_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_overview_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_overview_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_overview_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_overview_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_overview_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_overview_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_overview_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_overview_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_overview_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_overview_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_overview_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_overview_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_people_and_machines_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_people_and_machines_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_people_and_machines_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_people_and_machines_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_people_and_machines_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_people_and_machines_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_people_and_machines_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_people_and_machines_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_people_and_machines_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_people_and_machines_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_people_and_machines_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_people_and_machines_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_places_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_places_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_places_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_places_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_places_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_places_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_places_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_places_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_places_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_places_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_places_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_places_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_primary_detail_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_primary_detail_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_primary_detail"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_primary_detail_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_primary_detail_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_primary_detail_DELETE" BEFORE DELETE ON wiki."document_revision_text_primary_detail"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_primary_detail_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_primary_detail_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_primary_detail_INSERT" BEFORE INSERT ON wiki."document_revision_text_primary_detail"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_primary_detail_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_regions_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_regions_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_regions_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_regions_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_regions_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_regions_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_regions_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_regions_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_regions_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_regions_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_regions_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_regions_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_registry_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_registry_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_registry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_registry_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_registry_DELETE" BEFORE DELETE ON wiki."document_revision_text_registry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_registry_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_registry_INSERT" BEFORE INSERT ON wiki."document_revision_text_registry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_registry_entry_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_registry_entry_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_registry_entry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_entry_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_registry_entry_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_registry_entry_DELETE" BEFORE DELETE ON wiki."document_revision_text_registry_entry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_entry_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_registry_entry_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_registry_entry_INSERT" BEFORE INSERT ON wiki."document_revision_text_registry_entry"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_entry_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_registry_entry_relations_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_registry_entry_relations_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_registry_entry_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_entry_relations_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_registry_entry_relations_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_registry_entry_relations_DELETE" BEFORE DELETE ON wiki."document_revision_text_registry_entry_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_entry_relations_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_registry_entry_relations_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_registry_entry_relations_INSERT" BEFORE INSERT ON wiki."document_revision_text_registry_entry_relations"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_registry_entry_relations_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_simple_collection_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_simple_collection_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_simple_collection"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_simple_collection_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_simple_collection_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_simple_collection_DELETE" BEFORE DELETE ON wiki."document_revision_text_simple_collection"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_simple_collection_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_simple_collection_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_simple_collection_INSERT" BEFORE INSERT ON wiki."document_revision_text_simple_collection"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_simple_collection_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_station_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_station"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_station_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_DELETE" BEFORE DELETE ON wiki."document_revision_text_station"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_station_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_station_INSERT" BEFORE INSERT ON wiki."document_revision_text_station"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_station_alias_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_alias_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_station_alias"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_alias_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_station_alias_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_alias_DELETE" BEFORE DELETE ON wiki."document_revision_text_station_alias"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_alias_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_station_alias_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_station_alias_INSERT" BEFORE INSERT ON wiki."document_revision_text_station_alias"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_alias_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_station_catalog_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_catalog_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_station_catalog"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_catalog_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_station_catalog_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_catalog_DELETE" BEFORE DELETE ON wiki."document_revision_text_station_catalog"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_catalog_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_station_catalog_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_station_catalog_INSERT" BEFORE INSERT ON wiki."document_revision_text_station_catalog"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_catalog_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_station_line_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_line_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_station_line"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_line_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_station_line_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_line_DELETE" BEFORE DELETE ON wiki."document_revision_text_station_line"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_line_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_station_line_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_station_line_INSERT" BEFORE INSERT ON wiki."document_revision_text_station_line"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_line_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_station_line_name_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_line_name_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_station_line_name"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_line_name_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_station_line_name_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_station_line_name_DELETE" BEFORE DELETE ON wiki."document_revision_text_station_line_name"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_line_name_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_station_line_name_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_station_line_name_INSERT" BEFORE INSERT ON wiki."document_revision_text_station_line_name"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_station_line_name_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_structures_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_structures_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_structures_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_structures_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_structures_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_structures_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_structures_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_structures_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_structures_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_structures_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_structures_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_structures_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_technology_example_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_technology_example_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_technology_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_technology_example_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_technology_example_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_technology_example_DELETE" BEFORE DELETE ON wiki."document_revision_text_technology_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_technology_example_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_technology_example_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_technology_example_INSERT" BEFORE INSERT ON wiki."document_revision_text_technology_example"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_technology_example_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_level_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_level_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_level"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_level_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_level_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_level_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_level"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_level_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_level_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_level_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_level"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_level_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_map_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_map_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_map"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_map_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_map_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_map_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_map"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_map_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_map_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_map_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_map"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_map_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_parent_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_parent_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_parent"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_parent_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_parent_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_parent_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_parent"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_parent_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_parent_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_parent_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_parent"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_parent_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_parent_exception_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_parent_exception_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_parent_exception"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_parent_exception_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_parent_exception_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_parent_exception_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_parent_exception"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_parent_exception_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_parent_exception_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_parent_exception_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_parent_exception"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_parent_exception_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_political_axis_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_political_axis_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_political_axis"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_political_axis_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_political_axis_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_political_axis_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_political_axis"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_political_axis_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_political_axis_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_political_axis_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_political_axis"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_political_axis_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_rank_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_rank_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_rank_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_rank_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_rank_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_rank_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_rank_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_rank_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_rank_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_selectable_rank_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_selectable_rank_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_selectable_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_selectable_rank_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_selectable_rank_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_selectable_rank_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_selectable_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_selectable_rank_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_selectable_rank_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_selectable_rank_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_selectable_rank"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_selectable_rank_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_slot_edition_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_slot_edition_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_slot_edition"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_slot_edition_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_slot_edition_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_slot_edition_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_slot_edition"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_slot_edition_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_slot_edition_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_slot_edition_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_slot_edition"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_slot_edition_INSERT"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_source_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_source_UPDATE" BEFORE UPDATE ON wiki."document_revision_text_territorial_source"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_source_UPDATE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_source_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_source_DELETE" BEFORE DELETE ON wiki."document_revision_text_territorial_source"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_source_DELETE"();
CREATE FUNCTION wiki."guard_immutable_text_territorial_source_INSERT"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'immutable committed typed history';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "immutable_text_territorial_source_INSERT" BEFORE INSERT ON wiki."document_revision_text_territorial_source"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_immutable_text_territorial_source_INSERT"();
CREATE FUNCTION wiki."guard_line_document_policy_no_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_policy_no_UPDATE" BEFORE UPDATE ON wiki."line_document_policy"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_policy_no_UPDATE"();
CREATE FUNCTION wiki."guard_line_document_policy_no_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_policy_no_DELETE" BEFORE DELETE ON wiki."line_document_policy"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_policy_no_DELETE"();
CREATE FUNCTION wiki."guard_line_document_revision_no_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_revision_no_UPDATE" BEFORE UPDATE ON wiki."line_document_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_revision_no_UPDATE"();
CREATE FUNCTION wiki."guard_line_document_revision_no_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_revision_no_DELETE" BEFORE DELETE ON wiki."line_document_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_revision_no_DELETE"();
CREATE FUNCTION wiki."guard_line_document_revision_line_no_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_revision_line_no_UPDATE" BEFORE UPDATE ON wiki."line_document_revision_line"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_revision_line_no_UPDATE"();
CREATE FUNCTION wiki."guard_line_document_revision_line_no_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_revision_line_no_DELETE" BEFORE DELETE ON wiki."line_document_revision_line"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_revision_line_no_DELETE"();
CREATE FUNCTION wiki."guard_line_document_revision_line_sealed"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (EXISTS(SELECT 1 FROM "line_document_revision_seal" WHERE revision_id=NEW.revision_id)) THEN
    RAISE EXCEPTION 'sealed line revision';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "line_document_revision_line_sealed" BEFORE INSERT ON wiki."line_document_revision_line"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_revision_line_sealed"();
CREATE FUNCTION wiki."guard_line_document_seal_complete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
  IF (NOT EXISTS (   SELECT 1 FROM "line_document_revision" r WHERE r.source_id=NEW.source_id AND r.revision_id=NEW.revision_id     AND r.line_count=(SELECT count(*) FROM "line_document_revision_line" l WHERE l.revision_id=r.revision_id)     AND (r.line_count=0 OR (SELECT max(line_ordinal) FROM "line_document_revision_line" l WHERE l.revision_id=r.revision_id)=r.line_count-1) )) THEN
    RAISE EXCEPTION 'incomplete line revision';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "line_document_seal_complete" BEFORE INSERT ON wiki."line_document_revision_seal"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_seal_complete"();
CREATE FUNCTION wiki."guard_line_document_revision_seal_no_UPDATE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_revision_seal_no_UPDATE" BEFORE UPDATE ON wiki."line_document_revision_seal"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_revision_seal_no_UPDATE"();
CREATE FUNCTION wiki."guard_line_document_revision_seal_no_DELETE"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "line_document_revision_seal_no_DELETE" BEFORE DELETE ON wiki."line_document_revision_seal"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_line_document_revision_seal_no_DELETE"();
CREATE FUNCTION wiki."guard_document_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_archive_no_delete" BEFORE DELETE ON wiki."source_file"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_archive_no_delete"();
CREATE FUNCTION wiki."guard_document_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_archive_no_update" BEFORE UPDATE ON wiki."source_file"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_archive_no_update"();
CREATE FUNCTION wiki."guard_document_coordinates_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_coordinates_no_update" BEFORE UPDATE ON wiki."source_record"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_coordinates_no_update"();
CREATE FUNCTION wiki."guard_document_coordinates_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "document_coordinates_no_delete" BEFORE DELETE ON wiki."source_record"
  FOR EACH ROW EXECUTE FUNCTION wiki."guard_document_coordinates_no_delete"();
SET ROLE wiki_private_owner;
CREATE FUNCTION wiki_private."guard_node_parent_shape"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
  IF (NEW.parent_id IS NOT NULL) THEN
    IF NOT EXISTS (
    SELECT 1 FROM "ed_document_node" p WHERE p.document_id = NEW.document_id AND p.node_id = NEW.parent_id
      AND ((p.kind = 'object' AND NEW.member_key IS NOT NULL) OR (p.kind = 'array' AND NEW.member_key IS NULL))
  ) THEN
    RAISE EXCEPTION 'invalid tree parent';
  END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "node_parent_shape" BEFORE INSERT ON wiki_private."ed_document_node"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_node_parent_shape"();
CREATE FUNCTION wiki_private."guard_revision_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "revision_no_update" BEFORE UPDATE ON wiki_private."ed_document_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_revision_no_update"();
CREATE FUNCTION wiki_private."guard_revision_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "revision_no_delete" BEFORE DELETE ON wiki_private."ed_document_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_revision_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_archive_no_update" BEFORE UPDATE ON wiki_private."soul_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_archive_no_update"();
CREATE FUNCTION wiki_private."guard_soul_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_archive_no_delete" BEFORE DELETE ON wiki_private."soul_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_archive_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_edit_initialization_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_edit_initialization_no_update" BEFORE UPDATE ON wiki_private."soul_edit_initialization"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_edit_initialization_no_update"();
CREATE FUNCTION wiki_private."guard_soul_edit_initialization_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_edit_initialization_no_delete" BEFORE DELETE ON wiki_private."soul_edit_initialization"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_edit_initialization_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_edit_revision_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_edit_revision_no_update" BEFORE UPDATE ON wiki_private."soul_edit_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_edit_revision_no_update"();
CREATE FUNCTION wiki_private."guard_soul_edit_revision_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_edit_revision_no_delete" BEFORE DELETE ON wiki_private."soul_edit_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_edit_revision_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_head_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_head_no_delete" BEFORE DELETE ON wiki_private."soul_head"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_head_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_head_successor"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "soul_head_successor" BEFORE UPDATE ON wiki_private."soul_head"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_head_successor"();
CREATE FUNCTION wiki_private."guard_soul_identity_no_insert"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_identity_no_insert" BEFORE INSERT ON wiki_private."soul_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_identity_no_insert"();
CREATE FUNCTION wiki_private."guard_soul_identity_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_identity_no_update" BEFORE UPDATE ON wiki_private."soul_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_identity_no_update"();
CREATE FUNCTION wiki_private."guard_soul_identity_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_identity_no_delete" BEFORE DELETE ON wiki_private."soul_identity"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_identity_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_revision_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_revision_no_update" BEFORE UPDATE ON wiki_private."soul_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_revision_no_update"();
CREATE FUNCTION wiki_private."guard_soul_revision_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_revision_no_delete" BEFORE DELETE ON wiki_private."soul_revision"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_revision_no_delete"();
CREATE FUNCTION wiki_private."guard_editorial_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "editorial_archive_no_update" BEFORE UPDATE ON wiki_private."editorial_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_editorial_archive_no_update"();
CREATE FUNCTION wiki_private."guard_editorial_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "editorial_archive_no_delete" BEFORE DELETE ON wiki_private."editorial_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_editorial_archive_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_candidate_documents_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_candidate_documents_archive_no_update" BEFORE UPDATE ON wiki_private."soul_candidate_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_candidate_documents_archive_no_update"();
CREATE FUNCTION wiki_private."guard_soul_candidate_documents_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_candidate_documents_archive_no_delete" BEFORE DELETE ON wiki_private."soul_candidate_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_candidate_documents_archive_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_review_documents_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_review_documents_archive_no_update" BEFORE UPDATE ON wiki_private."soul_review_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_review_documents_archive_no_update"();
CREATE FUNCTION wiki_private."guard_soul_review_documents_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_review_documents_archive_no_delete" BEFORE DELETE ON wiki_private."soul_review_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_review_documents_archive_no_delete"();
CREATE FUNCTION wiki_private."guard_soul_batch_documents_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_batch_documents_archive_no_update" BEFORE UPDATE ON wiki_private."soul_batch_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_batch_documents_archive_no_update"();
CREATE FUNCTION wiki_private."guard_soul_batch_documents_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "soul_batch_documents_archive_no_delete" BEFORE DELETE ON wiki_private."soul_batch_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_soul_batch_documents_archive_no_delete"();
CREATE FUNCTION wiki_private."guard_opening_sample_documents_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "opening_sample_documents_archive_no_update" BEFORE UPDATE ON wiki_private."opening_sample_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_opening_sample_documents_archive_no_update"();
CREATE FUNCTION wiki_private."guard_opening_sample_documents_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "opening_sample_documents_archive_no_delete" BEFORE DELETE ON wiki_private."opening_sample_documents_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_opening_sample_documents_archive_no_delete"();
CREATE FUNCTION wiki_private."guard_editorial_envelope_archive_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "editorial_envelope_archive_no_update" BEFORE UPDATE ON wiki_private."env_editorial_envelope_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_editorial_envelope_archive_no_update"();
CREATE FUNCTION wiki_private."guard_editorial_envelope_archive_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "editorial_envelope_archive_no_delete" BEFORE DELETE ON wiki_private."env_editorial_envelope_archive"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_editorial_envelope_archive_no_delete"();
CREATE FUNCTION wiki_private."guard_evidence_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "evidence_no_update" BEFORE UPDATE ON wiki_private."ev_evidence"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_evidence_no_update"();
CREATE FUNCTION wiki_private."guard_evidence_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "evidence_no_delete" BEFORE DELETE ON wiki_private."ev_evidence"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_evidence_no_delete"();
CREATE FUNCTION wiki_private."guard_policy_no_insert"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "policy_no_insert" BEFORE INSERT ON wiki_private."ev_evidence_policy"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_policy_no_insert"();
CREATE FUNCTION wiki_private."guard_policy_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "policy_no_update" BEFORE UPDATE ON wiki_private."ev_evidence_policy"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_policy_no_update"();
CREATE FUNCTION wiki_private."guard_policy_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "policy_no_delete" BEFORE DELETE ON wiki_private."ev_evidence_policy"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_policy_no_delete"();
CREATE FUNCTION wiki_private."guard_reference_sealed"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
  IF (EXISTS (SELECT 1 FROM "ev_evidence" WHERE identity = NEW.source_identity)) THEN
    RAISE EXCEPTION 'immutable evidence references';
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END
$guard$;
CREATE TRIGGER "reference_sealed" BEFORE INSERT ON wiki_private."ev_evidence_reference"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_reference_sealed"();
CREATE FUNCTION wiki_private."guard_reference_no_update"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "reference_no_update" BEFORE UPDATE ON wiki_private."ev_evidence_reference"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_reference_no_update"();
CREATE FUNCTION wiki_private."guard_reference_no_delete"() RETURNS trigger LANGUAGE plpgsql SET search_path = wiki_private, pg_temp AS $guard$
BEGIN
END
$guard$;
CREATE TRIGGER "reference_no_delete" BEFORE DELETE ON wiki_private."ev_evidence_reference"
  FOR EACH ROW EXECUTE FUNCTION wiki_private."guard_reference_no_delete"();
RESET ROLE;
