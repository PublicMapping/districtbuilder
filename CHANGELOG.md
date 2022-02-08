# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Option to toggle which demographics to use for calculations [#1085](https://github.com/PublicMapping/districtbuilder/pull/1085)

- Add project-level info to geojson 'metadata' property [#1076](https://github.com/PublicMapping/districtbuilder/pull/1076)
- Add instructions on configuring PG Admin and on releasing new region data [#1081](https://github.com/PublicMapping/districtbuilder/pull/1081)
- Add blog link to Resource menu [#1083](https://github.com/PublicMapping/districtbuilder/pull/1083)
- Added cron task to REINDEX project table monthly [#1101](https://github.com/PublicMapping/districtbuilder/pull/1101)
- Add scrolling to Map configuration modal for best viewing multi-member district list [#1110](https://github.com/PublicMapping/districtbuilder/pull/1110)

### Changed

- Update evaluate copy to reflect terminology to match the top level geo of the map [#1077](https://github.com/PublicMapping/districtbuilder/pull/1077)
- Increase alloted memory for VM in Vagrantfile [#1079](https://github.com/PublicMapping/districtbuilder/pull/1079)
- Update README with clearer instructions on email verification [#1082](https://github.com/PublicMapping/districtbuilder/pull/1082)
- Update Node / Nest.JS / TypeORM / eslint / prettier [#1082](https://github.com/PublicMapping/districtbuilder/pull/1088)
- Update Node / Create React App / Theme-UI / TypeORM / eslint / prettier [#1104](https://github.com/PublicMapping/districtbuilder/pull/1104)
- Change page titles to be more descriptive [#1096](https://github.com/PublicMapping/districtbuilder/pull/1096)
- Change serialization format for TopoJSON data [#1099](https://github.com/PublicMapping/districtbuilder/pull/1099)

### Fixed

- Fix 404 error when deleting reference layers [#1119](https://github.com/PublicMapping/districtbuilder/pull/1119)
- Fix Reference Layer copy on other user's maps to reflect map's readonly status [#1078](https://github.com/PublicMapping/districtbuilder/pull/1078)
- Fix Equal Population status so red "X" doesn't show if within deviation threshold [#1084](https://github.com/PublicMapping/districtbuilder/pull/1084)
- Fix disappearing user data on Community Maps page refresh [#1090](https://github.com/PublicMapping/districtbuilder/pull/1090)
- Fix lack of error message in the import page when selecting a chamber with too few districts [#1091](https://github.com/PublicMapping/districtbuilder/pull/1091)
- Fix import performance on larger regions [#1100](https://github.com/PublicMapping/districtbuilder/pull/1100)
- Only show All, VAP & CVAP options for population choice [#1122](https://github.com/PublicMapping/districtbuilder/pull/1122)
- Fix hot reloading on environments using Vagrant [#1126](https://github.com/PublicMapping/districtbuilder/pull/1126)

## [1.13.0] - 2021-11-30

### Added

- Add support for creating/importing projects with multi-member districts [#1060](https://github.com/PublicMapping/districtbuilder/pull/1060)
- Add Map Configuration modal [#1065](https://github.com/PublicMapping/districtbuilder/pull/1065)

### Changed

- Update Competitiveness metric on Evaluate [#1068](https://github.com/PublicMapping/districtbuilder/pull/1068)

### Fixed

- Improve PlanScore integration and display toast on errors [#1062](https://github.com/PublicMapping/districtbuilder/pull/1062)
- Fix duplicate regions in Community Maps dropdown [#1070](https://github.com/PublicMapping/districtbuilder/pull/1070)

## [1.12.1] - 2021-10-29

### Fixed

- Fix import for regions that have a geounit with 1 identical geometry nested under it [#1053](https://github.com/PublicMapping/districtbuilder/pull/1053)
- Fix simplification for geojson with invalid geometries [#1054](https://github.com/PublicMapping/districtbuilder/pull/1054)
- Fix population deviation tooltip [#1055](https://github.com/PublicMapping/districtbuilder/pull/1055)

## [1.12.0] - 2021-10-25

### Changed

- Support negative/adjusted population values [#1043](https://github.com/PublicMapping/districtbuilder/pull/1043)

## [1.11.0] - 2021-10-11

### Added

- Add support for demographic groups, to support VAP / CVAP fields [#1034](https://github.com/PublicMapping/districtbuilder/pull/1034)
- Added bulk-reprocess-regions command [#1022](https://github.com/PublicMapping/districtbuilder/pull/1022)
- Import using a project template [#1033](https://github.com/PublicMapping/districtbuilder/pull/1033)

### Changed

- Don't require AWS credentials to load public S3 assets [#1036](https://github.com/PublicMapping/districtbuilder/pull/1036)
- Blocks and blockgroups are now populated with FIPS code in name field [#1022](https://github.com/PublicMapping/districtbuilder/pull/1022)
- The process-geojson command now returns non-zero exit codes on error [#1022](https://github.com/PublicMapping/districtbuilder/pull/1022)
- The process-geojson, publish-region, and update-region commands now include the input file in the output [#1022](https://github.com/PublicMapping/districtbuilder/pull/1022)

## [1.10.1] - 2021-09-29

### Fixed

- Fixed project import [#1029](https://github.com/PublicMapping/districtbuilder/pull/1029)
- Copy project template id when duplicating project [#1037](https://github.com/PublicMapping/districtbuilder/pull/1037)

## [1.10.0] - 2021-09-28

### Added

- Add support for uploading reference layers to a project [#902](https://github.com/PublicMapping/districtbuilder/pull/902)
- Show / delete reference layers for a project [#999](https://github.com/PublicMapping/districtbuilder/pull/999)
- Copy project template reference layers to project [#1018](https://github.com/PublicMapping/districtbuilder/pull/1018)

### Changed

- Support extra demographic fields on metrics viewer [#984](https://github.com/PublicMapping/districtbuilder/pull/984)
- Sort region configs by region code [#1004](https://github.com/PublicMapping/districtbuilder/pull/1004)
- Fix mini-maps for DC and other small regions [#1009](https://github.com/PublicMapping/districtbuilder/pull/1009)

## [1.9.0] - 2021-08-30

### Changed

- Updated copy on home screen for new users [#985](https://github.com/PublicMapping/districtbuilder/pull/985)
- Disable migration transactions in order to create project indexes concurrently [#989](https://github.com/PublicMapping/districtbuilder/pull/989)

### Fixed

- Disable Send to Plan Score button for incomplete projects [#957](https://github.com/PublicMapping/districtbuilder/pull/957)
- Fix Send to Plan Score button for other users projects [#958](https://github.com/PublicMapping/districtbuilder/pull/958)
- Restore Community Maps & fix API perf. [#969](https://github.com/PublicMapping/districtbuilder/pull/969)
- Fixed map outline ordering [#968](https://github.com/PublicMapping/districtbuilder/pull/968)
- Fixed pinned metrics for read-only projects [#976](https://github.com/PublicMapping/districtbuilder/pull/976)
- Fix duplicate button for projects in archived regions [#978](https://github.com/PublicMapping/districtbuilder/pull/978)
- Fix PVI calculation to not include third party votes & calc average correctly [#977](https://github.com/PublicMapping/districtbuilder/pull/977)
- Fix handling of expired authentication tokens [#986](https://github.com/PublicMapping/districtbuilder/pull/986)
- Don't show political data for regions without it on map tooltip [#987](https://github.com/PublicMapping/districtbuilder/pull/987)
- Hide convert overlay on map screen for other users projects [#988](https://github.com/PublicMapping/districtbuilder/pull/988)

## [1.8.0] - 2021-08-19

### Added

- Add levers to tune LB health check configuration [#950](https://github.com/PublicMapping/districtbuilder/pull/950)

### Changed

- Parameterize `max_old_space_size` [#942](https://github.com/PublicMapping/districtbuilder/pull/942)
- Don't define container-level CPU reservation [#942](https://github.com/PublicMapping/districtbuilder/pull/942)
- Remove CPU and memory limits for tasks on EC2 [#942](https://github.com/PublicMapping/districtbuilder/pull/942)
- Add lever for tuning CPU allocation at the task level [#942](https://github.com/PublicMapping/districtbuilder/pull/942)
- Scale `vm.max_map_count` with container memory usage [#942](https://github.com/PublicMapping/districtbuilder/pull/942)

### Fixed

- Fix CSV import by increasing max JSON payload to 25mb [#951](https://github.com/PublicMapping/districtbuilder/pull/951)
- Fix CSV export for other user's projects [#943](https://github.com/PublicMapping/districtbuilder/pull/943)

## [1.7.2] - 2021-08-13

### Changed

- Improve style for Majority-minor district indicator [#937](https://github.com/PublicMapping/districtbuilder/pull/937)
- Retry regions that fail to load in TopologyService [#944](https://github.com/PublicMapping/districtbuilder/pull/944)

### Fixed

- Fixed export GeoJSON endpoint cache busting [#940](https://github.com/PublicMapping/districtbuilder/pull/940)
- Fixed EC2-based ECS setup to use correct container [#938](https://github.com/PublicMapping/districtbuilder/pull/938)
- Fixed healthcheck when archived regions are loaded [#938](https://github.com/PublicMapping/districtbuilder/pull/938)

## [1.7.1] - 2021-08-12

### Fixed

- Fixed loading mini-maps for Projects w/o cached districts column [#928](https://github.com/PublicMapping/districtbuilder/pull/928)

## [1.7.0] - 2021-08-12

### Added

- Add button to display keyboard shortcuts modal [#787](https://github.com/PublicMapping/districtbuilder/pull/787)
- Add configurable population deviation [#762](https://github.com/PublicMapping/districtbuilder/pull/762)
- Display target population symbols in sidebar [#720](https://github.com/PublicMapping/districtbuilder/issues/720)
- List all published maps in new screen [#796](https://github.com/PublicMapping/districtbuilder/pull/796) & [#836](https://github.com/PublicMapping/districtbuilder/pull/836)
- Add map export to organization admin screen [#805](https://github.com/PublicMapping/districtbuilder/pull/805)
- Add support for Vagrant Development Environment [#729](https://github.com/PublicMapping/districtbuilder/pull/729)
- Add user export to organization admin screen [#812](https://github.com/PublicMapping/districtbuilder/pull/812)
- Add support for calculating PVI / handling '16 & '20 election data [#818](https://github.com/PublicMapping/districtbuilder/pull/818)
- Add tooltip for population deviation in project sidebar [#819](https://github.com/PublicMapping/districtbuilder/pull/819)
- Add ability to archive regions as read-only to reduce memory requirements [#831](https://github.com/PublicMapping/districtbuilder/pull/831)
- Add voting info to labels selector [#840](https://github.com/PublicMapping/districtbuilder/pull/840)
- Add evaluate mode metric view for competitiveness [#824](https://github.com/PublicMapping/districtbuilder/pull/824)
- Add expandable metrics viewer with ability to pin metrics to sidebar [#827](https://github.com/PublicMapping/districtbuilder/pull/827)
- Add user id and IP address to rollbar server side error logging [#841](https://github.com/PublicMapping/districtbuilder/pull/841)
- Add majority race metric to project sidebar [#853](https://github.com/PublicMapping/districtbuilder/pull/853) & [#916](https://github.com/PublicMapping/districtbuilder/pull/916)
- Add additional keyboard shortcuts [#854](https://github.com/PublicMapping/districtbuilder/pull/854)
- Add configurable slider to increase size of paintbrush selection tool [#835](https://github.com/PublicMapping/districtbuilder/pull/835)
- Add populationDeviation and chamber to import project screen [#845](https://github.com/PublicMapping/districtbuilder/pull/845)
- Add filter by state functionality to community maps page [#851](https://github.com/PublicMapping/districtbuilder/pull/851)
- Add button to upload project to PlanScore via API [#847](https://github.com/PublicMapping/districtbuilder/pull/847)
- Add maps to list of user projects on home screen [#850](https://github.com/PublicMapping/districtbuilder/pull/850) & [#893](https://github.com/PublicMapping/districtbuilder/pull/893)
- Add histogram to evaluate mode metric view for competitiveness [#844](https://github.com/PublicMapping/districtbuilder/pull/844)
- Added button to convert 2010 maps to 2020 [#878](https://github.com/PublicMapping/districtbuilder/pull/878)
- Add keyboard shortcuts for incrementing and decrementing the paintbrush size [#874](https://github.com/PublicMapping/districtbuilder/pull/874)
- Create auto scaling group and stand up new app service [#914](https://github.com/PublicMapping/districtbuilder/pull/914)

### Changed

- Only show pagination footer is more than one page is available [#915](https://github.com/PublicMapping/districtbuilder/pull/915)
- Switched race demographic colors to a palette with fewer conflicts to our other color palettes [#795](https://github.com/PublicMapping/districtbuilder/pull/795)
- Display evaluate mode toggle button in read-only mode [#786](https://github.com/PublicMapping/districtbuilder/pull/786)
- Disable keyboard shortcuts in evaluate mode [#784](https://github.com/PublicMapping/districtbuilder/pull/784)
- Only show competitiveness summary in evaluate sidebar if elections data is available [#896](https://github.com/PublicMapping/districtbuilder/pull/896)
- Ignore unassigned districts when computing flag for Contiguity and Equal Population [#797](https://github.com/PublicMapping/districtbuilder/pull/797)
- Rename Support menu to Resources [#787](https://github.com/PublicMapping/districtbuilder/pull/787)
- Switched race demographic colors to a palette with fewer conflicts to our other color palettes [#795](https://github.com/PublicMapping/districtbuilder/pull/795)
- Tweaks to org report downloads [#832](https://github.com/PublicMapping/districtbuilder/pull/832)
- Update population deviation helper text [#848](https://github.com/PublicMapping/districtbuilder/pull/848)
- Update display logic for political data in expandable metrics viewer [#864](https://github.com/PublicMapping/districtbuilder/pull/864)
- Update UX for duplication, showing a spinner when duplication is pending and redirecting when it completes [#872](https://github.com/PublicMapping/districtbuilder/pull/872)
- Added cache-busting to 'districts' column [#897](https://github.com/PublicMapping/districtbuilder/pull/897)
- Simplify districts used to display mini-map [#894](https://github.com/PublicMapping/districtbuilder/pull/894) & [#911](https://github.com/PublicMapping/districtbuilder/pull/911)

### Fixed

- Improved padding in the sidebar district rows, which had become unbalanced [#795](https://github.com/PublicMapping/districtbuilder/pull/795)
- Keyboard shortcuts no longer fire when form elements are focused [#823](https://github.com/PublicMapping/districtbuilder/pull/823)
- Fix breaking change to routing introduced with QueryParamsProvider [#869](https://github.com/PublicMapping/districtbuilder/pull/869)
- Fix duplicate project button on home screen projects [#872](https://github.com/PublicMapping/districtbuilder/pull/872) & [#892](https://github.com/PublicMapping/districtbuilder/pull/892)
- Fix find menu button so that it actually opens the find menu [#871](https://github.com/PublicMapping/districtbuilder/pull/871)
- Fix overlap between keyboard shortcuts and paintbrush size slider [#874](https://github.com/PublicMapping/districtbuilder/pull/874)
- Show file error when attempting to import a CSV for an unsupported region [#875](https://github.com/PublicMapping/districtbuilder/pull/875)
- Increased timeout on database healthcheck [#877](https://github.com/PublicMapping/districtbuilder/pull/877)
- Fix archive not updating list of projects [#892](https://github.com/PublicMapping/districtbuilder/pull/892)
- Redirect to home screen after successful login [#895](https://github.com/PublicMapping/districtbuilder/pull/895)
- Improved handling large number of import flags [#888](https://github.com/PublicMapping/districtbuilder/pull/888)
- Fixed creating districts from project template [#905](https://github.com/PublicMapping/districtbuilder/pull/905)
- Hide archived projects from community maps page [#927](https://github.com/PublicMapping/districtbuilder/pull/927)

## [1.6.0] - 2021-05-24

### Added

- Update map view for evaluate mode [#727](https://github.com/PublicMapping/districtbuilder/pull/727)
- Show minority-majority districts in sidebar [#763](https://github.com/PublicMapping/districtbuilder/pull/763)
- Add voting info to map tooltip [#751](https://github.com/PublicMapping/districtbuilder/pull/751)
- Add majority-minority evaluate mode view [#839](https://github.com/PublicMapping/districtbuilder/pull/839)

### Changed

- Update race column to handle different race categories [#766](https://github.com/PublicMapping/districtbuilder/pull/766)
- Cleanup text in evaluate mode [#776](https://github.com/PublicMapping/districtbuilder/pull/776)

### Fixed

- Fix handling of switching into block editing when using keyboard shortcut [#758](https://github.com/PublicMapping/districtbuilder/pull/758)
- Fix switching into/out of evaluate mode [#775](https://github.com/PublicMapping/districtbuilder/pull/775)
- Fix showing blockgroup selections when viewing the county geolevel [#781](https://github.com/PublicMapping/districtbuilder/pull/781)
- Don't show limit to county option in read-only mode [#777](https://github.com/PublicMapping/districtbuilder/pull/777)
- Include unassigned district when switching using keyboard shortcuts [#779](https://github.com/PublicMapping/districtbuilder/pull/779)
- Fix calculation of average compactness [#778](https://github.com/PublicMapping/districtbuilder/pull/778)
- Fix computation of equal population flags for population deviation of zero [#806](https://github.com/PublicMapping/districtbuilder/pull/806)

## [1.5.0] - 2021-05-13

### Added

- Add toggle to limit drawing to within starting county [#698](https://github.com/PublicMapping/districtbuilder/pull/698)
- Add project evaluate view for Equal Population [#685](https://github.com/PublicMapping/districtbuilder/pull/685)
- Toggle map pan tool when holding down spacebar in rectangle / paintbrush select mode [#687](https://github.com/PublicMapping/districtbuilder/pull/687)
- Highlight selected/hovered districts and zoom to district [#688](https://github.com/PublicMapping/districtbuilder/pull/688)
- Added unique index on region config table for country / region code [#702](https://github.com/PublicMapping/districtbuilder/pull/702)
- Display warnings and row-level flags for district import [#708](https://github.com/PublicMapping/districtbuilder/pull/708)
- Add keyboard shortcuts for map functions [#718](https://github.com/PublicMapping/districtbuilder/pull/718)
- Added voting info to sidebar [#730](https://github.com/PublicMapping/districtbuilder/pull/730)

### Changed

- Style Evaluate Mode panel [#724](https://github.com/PublicMapping/districtbuilder/pull/724)
- Change eslint config to detect misuse of NestJS services [#700](https://github.com/PublicMapping/districtbuilder/pull/700)
- Log non-HTTP errors to Rollbar [#725](https://github.com/PublicMapping/districtbuilder/pull/725)
- Changed default project visibility, prevent org admins from seeing private maps [#754](https://github.com/PublicMapping/districtbuilder/pull/754)

### Fixed

- Fix import region detection to exclude hidden regions [#702](https://github.com/PublicMapping/districtbuilder/pull/702)
- Display unassigned areas as transparent fill in Evaluate mode map [#694](https://github.com/PublicMapping/districtbuilder/pull/699)
- Minor style cleanup for organizations page and dropdown [#709](https://github.com/PublicMapping/districtbuilder/pull/709)
- Make password validation visible in modal [#706](https://github.com/PublicMapping/districtbuilder/pull/706)
- Sorting on organization admin table [#711](https://github.com/PublicMapping/districtbuilder/pull/711)
- Fix joining/leaving organization with an inactive project template [#721](https://github.com/PublicMapping/districtbuilder/pull/721)
- Show maps for inactive project templates [#721](https://github.com/PublicMapping/districtbuilder/pull/721)
- Only check file extension and not file type for CSV imports [#723](https://github.com/PublicMapping/districtbuilder/pull/723)
- Fix off-by-one error in district lock handling [#741](https://github.com/PublicMapping/districtbuilder/pull/741)

## [1.4.0] - 2021-04-12

### Added

- Share menu now controls map visibility (private/public/shared w link) [#560](https://github.com/PublicMapping/districtbuilder/pull/560)
- Organization detail screen [#562](https://github.com/PublicMapping/districtbuilder/pull/562)
- Organization templates [#581](https://github.com/PublicMapping/districtbuilder/pull/581)
- Duplicate a map from home screen [#572](https://github.com/PublicMapping/districtbuilder/pull/572)
- Add script to load region config and organization for testing [#575](https://github.com/PublicMapping/districtbuilder/pull/575) & [#632](https://github.com/PublicMapping/districtbuilder/pull/632)
- Store chamber reference on project entity [#576](https://github.com/PublicMapping/districtbuilder/pull/576)
- Display error page for 404 errors [#582](https://github.com/PublicMapping/districtbuilder/pull/582)
- Allow users to join and leave an organization [#226](https://github.com/PublicMapping/districtbuilder/pull/578)
- Require users to confirm before joining an organization [#593](https://github.com/PublicMapping/districtbuilder/pull/593) & [#615](https://github.com/PublicMapping/districtbuilder/pull/615)
- Show not found page for missing projects and organizations [#613](https://github.com/PublicMapping/districtbuilder/pull/613)
- Add paintbrush drawing tool [#611](https://github.com/PublicMapping/districtbuilder/pull/611)
- Add verify and join link to user verification email [#616](https://github.com/PublicMapping/districtbuilder/pull/616)
- Display organizations dropdown in header [#620](https://github.com/PublicMapping/districtbuilder/pull/620)
- Organization Admin page and featured map workflow [#614](https://github.com/PublicMapping/districtbuilder/pull/614), [#671](https://github.com/PublicMapping/districtbuilder/pull/671) & [#675](https://github.com/PublicMapping/districtbuilder/pull/675)

- Build out scaffolding for Project Evaluate view [#623](https://github.com/PublicMapping/districtbuilder/pull/623)
- Add flag on project templates to mark as active or inactive [#626](https://github.com/PublicMapping/districtbuilder/pull/626)
- Display featured projects on Organization page [#633](https://github.com/PublicMapping/districtbuilder/pull/633)
- Add import plan page [#639](https://github.com/PublicMapping/districtbuilder/pull/639) & [#670](https://github.com/PublicMapping/districtbuilder/pull/670)
- Add project evaluate view for compactness [#646](https://github.com/PublicMapping/districtbuilder/pull/646)
- Allow user to create a project with an organization template from Create Project screen [#638](https://github.com/PublicMapping/districtbuilder/pull/638)
- Add button to Organization page to link to Organization Admin page for admin users [#669](https://github.com/PublicMapping/districtbuilder/pull/669)
- Add project evaluate view for contiguity [#648](https://github.com/PublicMapping/districtbuilder/pull/648)
- Add project evaluate view for County Splits [#644](https://github.com/PublicMapping/districtbuilder/pull/644)
- Display Import Map button on home screen when a user has not created maps yet [#674](https://github.com/PublicMapping/districtbuilder/pull/674)
- Display export button in project header for published projects from other users [#681](https://github.com/PublicMapping/districtbuilder/pull/681)

### Changed

- Geounit label made more generic to support Dane County wards [#573](https://github.com/PublicMapping/districtbuilder/pull/573)
- Update ESLint rules to prohibit console.log, allow conditional statements [#580](https://github.com/PublicMapping/districtbuilder/pull/580)
- Prevent unverified users from joining an organization or using a template [#591](https://github.com/PublicMapping/districtbuilder/pull/591)
- Project districts geojson is now cached in the project table when updated [#594](https://github.com/PublicMapping/districtbuilder/pull/594)
- Upgrade NestJS deps [#637](https://github.com/PublicMapping/districtbuilder/pull/637)
- Refactor project evaluate mode views [#642](https://github.com/PublicMapping/districtbuilder/pull/642)
- Link featured projects in Organization screen to project detail pages [#657](https://github.com/PublicMapping/districtbuilder/pull/657)
- Add creator email and project link to Org Admin screen [#664](https://github.com/PublicMapping/districtbuilder/pull/664)
- Allow admins to view projects created from organization template [#672](https://github.com/PublicMapping/districtbuilder/pull/672)
- Fix bug where projects are created after closing Join Organization modal triggered from an organization's template [#673](https://github.com/PublicMapping/districtbuilder/pull/673)

### Fixed

- Allow last district to be locked [#677](https://github.com/PublicMapping/districtbuilder/pull/677)
- Allow editing at lower geolevels after toggling evaluate mode [#679](https://github.com/PublicMapping/districtbuilder/pull/679)
- Fix off screen geounits deselected when using rectangle tool [#680](https://github.com/PublicMapping/districtbuilder/pull/680)
- Set project as unfeatured if private [#686](https://github.com/PublicMapping/districtbuilder/pull/686)

## [1.3.0] - 2021-01-26

- Update Create a Map's helper text for the State input [#552](https://github.com/PublicMapping/districtbuilder/pull/552)
- Style modal dialogs related to "Copy map" feature [#553](https://github.com/PublicMapping/districtbuilder/pull/553)

### Added

- Added Shapefile export [#516](https://github.com/PublicMapping/districtbuilder/pull/516) & [#556](https://github.com/PublicMapping/districtbuilder/pull/556)
- Allow copying maps [#526](https://github.com/PublicMapping/districtbuilder/pull/526)
- Reduce problem with hidden base geounits [#528](https://github.com/PublicMapping/districtbuilder/pull/528)
- Find non-contiguous [#531](https://github.com/PublicMapping/districtbuilder/pull/531)
- Add last updated date to map list [#541](https://github.com/PublicMapping/districtbuilder/pull/541)
- Allow exporting map GeoJSON [#543](https://github.com/PublicMapping/districtbuilder/pull/543)
- Delete/archive map option [#547](https://github.com/PublicMapping/districtbuilder/pull/547)

### Changed

- Remove "Copy this map" button from owned maps [#545](https://github.com/PublicMapping/districtbuilder/pull/545)

### Fixed

- Don't show district lock status on read-only maps [#538](https://github.com/PublicMapping/districtbuilder/pull/538)
- Fix topology health check to report inability to load region configs as an error [#546](https://github.com/PublicMapping/districtbuilder/pull/546)
- Keep position in find menu after accepting changes [#557](https://github.com/PublicMapping/districtbuilder/pull/557)

## [1.2.0] - 2020-11-18

### Added

- Microcopy to Create Map and description props to text and select fields [#467](https://github.com/PublicMapping/districtbuilder/pull/467)
- Add product tour [#471](https://github.com/PublicMapping/districtbuilder/pull/471)
- Update data tooling [#468](https://github.com/PublicMapping/districtbuilder/pull/468)
- Find unassigned menu [#476](https://github.com/PublicMapping/districtbuilder/pull/476)
- Add support for single county region [#479](https://github.com/PublicMapping/districtbuilder/pull/479)
- Edit project name [#488](https://github.com/PublicMapping/districtbuilder/pull/488)
- Allow exporting plan to district index file CSV [#499](https://github.com/PublicMapping/districtbuilder/pull/499)

### Changed

- Updates to project page sharing & read-only mode [#469](https://github.com/PublicMapping/districtbuilder/pull/469)
- Specify max-old-space-size on server [#470](https://github.com/PublicMapping/districtbuilder/pull/470)
- Fix formatting of population counts [#474](https://github.com/PublicMapping/districtbuilder/pull/474)
- Make it possible to swap out the RDS DB parameter group [#478](https://github.com/PublicMapping/districtbuilder/pull/478)
- Allow saving with undo/redo [#498](https://github.com/PublicMapping/districtbuilder/pull/498)

### Fixed

- Fix region config validation error [#500](https://github.com/PublicMapping/districtbuilder/pull/500)

## [1.1.0] - 2020-10-08

### Added

- Project page sharing & read-only mode [#449](https://github.com/PublicMapping/districtbuilder/pull/449)
- Set keep-alive timeout higher than ALB idle timeout [#448](https://github.com/PublicMapping/districtbuilder/pull/448)
- Add basic k6 load test for PA/50 district project [#448](https://github.com/PublicMapping/districtbuilder/pull/448)
- Use web workers for real-time demographic updates [#452](https://github.com/PublicMapping/districtbuilder/pull/452)
- Undo/redo functionality on project page [#457](https://github.com/PublicMapping/districtbuilder/pull/457)

### Changed

### Fixed

## [1.0.0] - 2020-09-23

### Added

- Support menu on landing and project page [#435](https://github.com/PublicMapping/districtbuilder/pull/435)
- Allow for selecting partially locked districts [#420](https://github.com/PublicMapping/districtbuilder/pull/420)
- Show toast on errors [#437](https://github.com/PublicMapping/districtbuilder/pull/437)
- Add the ability to query ALB logs with Athena [#441](https://github.com/PublicMapping/districtbuilder/pull/441)
- Don't re-request data unnecessarily after saving project changes [#443](https://github.com/PublicMapping/districtbuilder/pull/443)

### Changed

- Make button group styles more consistent [#440](https://github.com/PublicMapping/districtbuilder/pull/440)
- Improved lock button UX [#436](https://github.com/PublicMapping/districtbuilder/pull/436)
- Allow for selecting partially locked districts [#420](https://github.com/PublicMapping/districtbuilder/pull/420)
- Add "Saved" notification in sidebar when map is successfully saved to cloud [#439](https://github.com/PublicMapping/districtbuilder/pull/439)
- Reduce noise in log output [#399](https://github.com/PublicMapping/districtbuilder/pull/399)
- Upgrade development database to PostgreSQL 12.2 and PostGIS 3 [#421](https://github.com/PublicMapping/districtbuilder/pull/421)

### Fixed

- Fix S3 permissions to allow CloudFront logging [#410](https://github.com/PublicMapping/districtbuilder/pull/410)
- Fix problem with highlighted resetting [#442](https://github.com/PublicMapping/districtbuilder/pull/442)
- Fix saved notification [#445](https://github.com/PublicMapping/districtbuilder/pull/445)

## [0.1.0] - 2020-09-14

- Initial release.

[unreleased]: https://github.com/publicmapping/districtbuilder/compare/1.13.0...HEAD
[1.13.0]: https://github.com/publicmapping/districtbuilder/compare/1.12.1...1.13.0
[1.12.1]: https://github.com/publicmapping/districtbuilder/compare/1.12.0...1.12.1
[1.12.0]: https://github.com/publicmapping/districtbuilder/compare/1.11.0...1.12.0
[1.11.0]: https://github.com/publicmapping/districtbuilder/compare/1.10.1...1.11.0
[1.10.1]: https://github.com/publicmapping/districtbuilder/compare/1.10.0...1.10.1
[1.10.0]: https://github.com/publicmapping/districtbuilder/compare/1.9.0...1.10.0
[1.9.0]: https://github.com/publicmapping/districtbuilder/compare/1.8.0...1.9.0
[1.8.0]: https://github.com/publicmapping/districtbuilder/compare/1.7.2...1.8.0
[1.7.2]: https://github.com/publicmapping/districtbuilder/compare/1.7.1...1.7.2
[1.7.1]: https://github.com/publicmapping/districtbuilder/compare/1.7.0...1.7.1
[1.7.0]: https://github.com/publicmapping/districtbuilder/compare/1.6.0...1.7.0
[1.6.0]: https://github.com/publicmapping/districtbuilder/compare/1.5.0...1.6.0
[1.5.0]: https://github.com/publicmapping/districtbuilder/compare/1.4.0...1.5.0
[1.4.0]: https://github.com/publicmapping/districtbuilder/compare/1.3.0...1.4.0
[1.3.0]: https://github.com/publicmapping/districtbuilder/compare/1.2.0...1.3.0
[1.2.0]: https://github.com/publicmapping/districtbuilder/compare/1.1.0...1.2.0
[1.1.0]: https://github.com/publicmapping/districtbuilder/compare/1.0.0...1.1.0
[1.0.0]: https://github.com/publicmapping/districtbuilder/compare/0.1.0...1.0.0
[0.1.0]: https://github.com/publicmapping/districtbuilder/compare/b9c63f4...0.1.0
