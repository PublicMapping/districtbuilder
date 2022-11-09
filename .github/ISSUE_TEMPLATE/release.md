---
name: Release
about: When ready to cut a release
title: Release X.Y.Z
labels: release
assignees: ''

---

- [ ] Confirm the develop branch and staging environment is healthy (incuding Green checkmark on last build)
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
- [ ] Finish and publish the release branch:
    - When prompted, keep default commit messages
    - Use `X.Y.Z` as the tag message
```bash
$ git flow release finish -p X.Y.Z 
```
- [ ] This will kick off a new develop build and staging deploy. Wait until that is fully done (Green checkbox) and staging is working from it.
- [ ] Start a new [release workflow](https://github.com/PublicMapping/districtbuilder/actions/workflows/release.yml) with the SHA (see command below) of `release/X.Y.Z` that was tested on staging
```bash
$ git rev-parse --short HEAD
```
- [ ] Run migrations, if applicable, following these [instructions](https://github.com/PublicMapping/districtbuilder/tree/develop/deployment#migrations)