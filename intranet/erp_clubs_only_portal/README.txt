# CU Clubs Portal - ERP Integration Build (Clubs Pages Only)

This is a clean, dependency-free build containing ONLY the club portal pages (clubs.html and clubv2.html) ready for ERP integration. 

## Directory Structure
- `clubs.html`, `clubv2.html`: The core portal pages.
- `clubs.json`: The single source of truth data file for all clubs.
- `latest-assets/`, `campus-life/`, `new-assets/`, `includes/`: CSS, JS, and fonts required by the pages.
- `logos/` & `media/`: Images and gallery assets for clubs.

## Notes for Integration
All asset references in the HTML files are relative (e.g., `./logos/logo.png`). You can drop this entire folder into any sub-directory on your server without causing locational/routing errors. 
The pages automatically read from `clubs.json`. To update the content, simply replace the `clubs.json` file.
