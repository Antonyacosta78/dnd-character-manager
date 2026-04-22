# Character Core Open Issues

- AC13 analytics event emission is currently a safe placeholder (no analytics pipeline exists in repo yet).
- API not-found responses currently use `REQUEST_VALIDATION_FAILED` code with `404` status in some new routes to avoid introducing a new error code outside current contract.
- PDF export uses generated text bytes with `application/pdf` for MVP compatibility; dedicated PDF renderer is deferred.
