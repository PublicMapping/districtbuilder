---
name: Release
about: When ready to cut a release
title: Release X.Y.Z
labels: release
assignees: ''

---

- [ ] Start a new release branch:
```bash
$ git flow release start X.Y.Z
```
- [ ] Rotate `CHANGELOG.md` (following [Keep a Changelog](https://keepachangelog.com/) principles)
- [ ] Ensure outstanding changes are committed:
```bash
$ git status # Is the git staging area clean?
$ git add CHANGELOG.md
$ git commit -m "X.Y.Z"
```
- [ ] Publish the release branch:
```bash
$ git flow release publish X.Y.Z
```
- [ ] Test the release branch on staging
- [ ] Start a new [release pipeline job](http://urbanappsci.internal.azavea.com/job/DistrictBuilder%20Release%20Pipeline/build?delay=0sec) with the SHA (see command below) of `release/X.Y.Z` that was tested on staging
```bash
$ git rev-parse --short HEAD
```
- [ ] Run migrations, if applicable, following these [instructions](https://github.com/PublicMapping/districtbuilder/tree/develop/deployment#migrations)
- [ ] Finish and publish the release branch:
    - When prompted, keep default commit messages
    - Use `X.Y.Z` as the tag message
```bash
$ git flow release finish -p X.Y.Z 
```
