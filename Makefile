.PHONY: release release-patch release-minor release-major

## Release targets — bump version, tag, and push to trigger the release workflow.
## Usage:
##   make release-patch   # 0.1.0 → 0.1.1
##   make release-minor   # 0.1.0 → 0.2.0
##   make release-major   # 0.1.0 → 1.0.0
##   make release          # alias for release-patch

release: release-patch

release-patch:
	npm version patch && git push --follow-tags

release-minor:
	npm version minor && git push --follow-tags

release-major:
	npm version major && git push --follow-tags
