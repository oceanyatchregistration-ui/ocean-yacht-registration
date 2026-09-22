-- Retire legacy Astra catalogue entries that conflict with the client's confirmed service list.
UPDATE services SET active=0 WHERE id IN ('registration-renewal','flag-change');
