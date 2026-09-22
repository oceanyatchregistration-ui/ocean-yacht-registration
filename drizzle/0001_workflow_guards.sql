CREATE TRIGGER applications_validate_transition
BEFORE UPDATE OF status ON applications
WHEN OLD.status <> NEW.status
BEGIN
  SELECT (CASE WHEN NOT (
    (OLD.status='DRAFT' AND NEW.status='SUBMITTED') OR
    (OLD.status='SUBMITTED' AND NEW.status IN ('UNDER_REVIEW','CANCELLED')) OR
    (OLD.status='UNDER_REVIEW' AND NEW.status IN ('ADDITIONAL_DOCUMENTS_REQUIRED','PROCESSING','CANCELLED')) OR
    (OLD.status='ADDITIONAL_DOCUMENTS_REQUIRED' AND NEW.status IN ('UNDER_REVIEW','CANCELLED')) OR
    (OLD.status='PROCESSING' AND NEW.status IN ('ADDITIONAL_DOCUMENTS_REQUIRED','COMPLETED','CANCELLED'))
  ) THEN RAISE(ABORT,'invalid status transition') END);
  SELECT (CASE WHEN NEW.version<>OLD.version+1 THEN RAISE(ABORT,'status version must advance') END);
  SELECT (CASE WHEN NEW.customer_id IS NULL OR NEW.vessel_id IS NULL OR NEW.service_id IS NULL OR NEW.submitted_at IS NULL OR NEW.consent_at IS NULL OR NEW.pricing_snapshot IS NULL THEN RAISE(ABORT,'incomplete application') END);
  SELECT (CASE WHEN OLD.status<>'DRAFT' AND NOT EXISTS(SELECT 1 FROM users WHERE id=NEW.last_actor_id AND role='ADMIN') THEN RAISE(ABORT,'admin actor required') END);
END;
--> statement-breakpoint
CREATE TRIGGER applications_record_status
AFTER UPDATE OF status ON applications
WHEN OLD.status <> NEW.status
BEGIN
  INSERT INTO application_status_history(id,application_id,from_status,to_status,actor_id,public_message,created_at,version)
  VALUES(lower(hex(randomblob(16))),NEW.id,OLD.status,NEW.status,NEW.last_actor_id,NEW.last_public_message,NEW.updated_at,NEW.version);
  INSERT INTO notifications(id,application_id,kind,channel,created_at)
  VALUES(lower(hex(randomblob(16))),NEW.id,CASE WHEN OLD.status='DRAFT' THEN 'APPLICATION_SUBMITTED' ELSE 'STATUS_CHANGED' END,'ADMIN_INBOX',NEW.updated_at);
END;
--> statement-breakpoint
CREATE TRIGGER history_no_updates BEFORE UPDATE ON application_status_history
BEGIN SELECT RAISE(ABORT,'status history is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER history_no_deletes BEFORE DELETE ON application_status_history
BEGIN SELECT RAISE(ABORT,'status history is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER documents_only_in_draft BEFORE INSERT ON application_documents
BEGIN
  SELECT (CASE WHEN NOT EXISTS(SELECT 1 FROM applications WHERE id=NEW.application_id AND status='DRAFT') THEN RAISE(ABORT,'application is not a draft') END);
END;
--> statement-breakpoint
CREATE TRIGGER documents_no_update BEFORE UPDATE ON application_documents
BEGIN SELECT RAISE(ABORT,'document metadata is immutable'); END;
--> statement-breakpoint
CREATE TRIGGER documents_no_delete_after_submission BEFORE DELETE ON application_documents
WHEN EXISTS(SELECT 1 FROM applications WHERE id=OLD.application_id AND status<>'DRAFT')
BEGIN SELECT RAISE(ABORT,'submitted documents cannot be deleted'); END;
