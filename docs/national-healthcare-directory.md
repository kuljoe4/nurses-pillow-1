# National Healthcare Directory

Nurses Pillow maintains one US-wide healthcare facility directory. Marketplace territory activation is a separate control: it must never filter facility discovery or determine whether a facility exists.

## Initial source

The first import source is CMS Hospital General Information:

- Dataset: https://data.cms.gov/provider-data/dataset/xubh-q36u
- Dataset ID: `xubh-q36u`
- Publisher: Centers for Medicare & Medicaid Services
- Scope: hospitals registered with Medicare (not every US healthcare facility)
- The current CMS catalog lists 5,419 records. Re-check the catalog before each import because the dataset changes.

CMS records include facility identifiers, names, addresses, state, ZIP, county, phone and hospital type. They do not supply latitude/longitude in this dataset. Imported records therefore enter with `data_quality_status = needs_geocoding` and are excluded from proximity calculations until coordinates are added.

## Import

Run from a trusted deployment/admin environment with the production PostgreSQL connection configured:

```bash
npm run import:hospitals:cms
```

The importer pages through the CMS API, uses the CMS certification number (CCN) as the stable source identifier, attaches identifiers to exact name/state/ZIP matches already in the directory where possible, and records an import audit row in `healthcare_directory_imports`.

Do not run concurrent imports. Review the audit row and rejected count after completion.

## Geocoding

Geocoding uses the US Census Bureau Geocoder, a public address-to-coordinate service that does not require a Google API key. It uses the current Public Address Range benchmark. Run bounded batches:

```bash
GEOCODE_LIMIT=100 npm run geocode:hospitals:cms
```

Repeat batches after reviewing match quality and Google usage. The script stores Census TIGER address-range coordinates for matched addresses. Census coordinates are interpolated along address ranges and may not pinpoint a building entrance. Review ambiguous or skipped records manually. A geocode match does not prove current licensure, accreditation, emergency capability or operational status.

## Runtime behaviour

- `GET /api/hospitals` returns the active national directory, regardless of marketplace state launch status.
- `GET /api/hospitals/nearby` searches all active, geocoded directory facilities and returns territory status separately.
- Host discovery searches 20 miles first, then expands to 50 miles if no facilities are found.
- Listing proximity caches retain nearby facilities up to 50 miles, independent of territory activation.
- Public listings and booking eligibility remain subject to the active-territory rules.
- Hosts can submit missing-facility reports. Admins can inspect directory coverage, import history, geocoding gaps and pending reports through `GET /api/admin/healthcare-directory/summary`.

## Important coverage limitations

CMS Hospital General Information is a national hospital baseline, not a complete inventory of every healthcare workplace. It does not cover every clinic, urgent care centre, outpatient department, specialty facility or non-Medicare hospital. The broader CMS Provider of Services file and NPPES organizational records should be added as separately classified source feeds after their schemas and deduplication rules are reviewed. Never treat every NPI record as a hospital or as proof of licensure.

Do not deactivate records merely because they disappear from one source refresh. Reconcile source snapshots and verify status before changing facility availability.
