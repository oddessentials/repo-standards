# .gitattributes for Go projects
# See gitattributes.base for common patterns
#
# After adding this file, run:
#   git add --renormalize .
#   git commit -m "chore: normalize line endings"

# Default: Auto-detect text files and normalize to LF on commit
* text=auto eol=lf

# Go source files
*.go text eol=lf

# Go module files
go.mod text eol=lf
go.sum text eol=lf
go.work text eol=lf
go.work.sum text eol=lf

# Go version file
.go-version text eol=lf

# Shell scripts - MUST be LF
*.sh text eol=lf
*.bash text eol=lf
Makefile text eol=lf

# Git configuration
.gitattributes text eol=lf
.gitignore text eol=lf

# CI/CD configuration
*.yml text eol=lf
*.yaml text eol=lf
Dockerfile text eol=lf
docker-compose*.yml text eol=lf
.goreleaser.yml text eol=lf
.goreleaser.yaml text eol=lf

# Linting configuration
.golangci.yml text eol=lf
.golangci.yaml text eol=lf

# Protocol Buffers (common in Go projects)
*.proto text eol=lf

# Documentation
*.md text eol=lf
LICENSE text eol=lf

# Common binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.webp binary
*.svg binary
*.pdf binary
*.zip binary
*.tar.gz binary
*.exe binary
*.dll binary
*.so binary
*.dylib binary
