-- Publication Candidate Function Owner Contract Alignment v1.
-- Normalizes the internal candidate helper owner without changing its body,
-- runtime ACL, security mode, volatility, settings, or data.

begin;

alter function cloud.product_publication_candidate_payload_v1(uuid)
  owner to postgres;

commit;
