# CI/CD — EduAI Companion

Fully automated pipeline: **code change → test → container build & push (GHCR) → automatic
versioning (git tag + GitHub Release) → rolling Kubernetes deploy**. No manual steps after the
one-time cluster setup below.

```
┌────────────┐   ┌───────────────────┐   ┌──────────────────────────┐   ┌────────────────────┐   ┌──────────────────────┐
│ push / PR  │──►│ 1. Lint & Build   │──►│ 2. Docker Build & Push   │──►│ 3. Tag & Release   │──►│ 4. Deploy to K8s      │
└────────────┘   │ tsc + vite build  │   │ ghcr.io/zwenix/          │   │ vX.Y.Z git tag     │   │ kubectl apply -k     │
                 │ + boot smoke test │   │ eduaicompanion:<tags>    │   │ + GitHub Release   │   │ set image + rollout  │
                 └───────────────────┘   └──────────────────────────┘   └────────────────────┘   └──────────────────────┘
                  all pushes + PRs        main + same-repo PRs           main only (idempotent)   main only (skip if
                                                                                                 KUBE_CONFIG_DATA unset)
```

Files:

| Path | Purpose |
|---|---|
| `.github/workflows/ci-cd.yml` | The pipeline (4 jobs) — **paste-ready copy: [`docs/ci-cd.workflow.yml`](ci-cd.workflow.yml)** (see its header for the one-time Web UI paste, required because the sandbox's GitHub App token lacks `workflows` permission) |
| `Dockerfile` / `.dockerignore` | Multi-stage production image (Node 22, non-root, healthcheck) |
| `scripts/compute-version.mjs` | Automatic semver from git tags + Conventional Commits |
| `deploy/k8s/base/` | Namespace, Deployment, Service, kustomization |
| `deploy/k8s/base/secret.example.yaml` | App Secret template (create once, real values) |
| `deploy/k8s/base/ingress.example.yaml` | Optional Ingress template (apply once, real domain) |

## Triggers & behaviour

| Event | What runs |
|---|---|
| `push` to `main` | Full pipeline: test → build+push (`<semver>`, `<sha>`, `latest`) → release → K8s deploy |
| `pull_request` (same repo) | Test → build+push `:pr-<number>` (no release, no deploy) |
| `pull_request` (fork) | Test only (fork PRs can't push packages) |
| `workflow_dispatch` | Manual "Run workflow" — behaves like a push to main |

Duplicate pushes / re-runs are **idempotent**: if HEAD already carries a `vX.Y.Z` tag, the
release job skips and the deploy just re-rolls the same image.

## Automatic versioning rules

Implemented in [`scripts/compute-version.mjs`](../scripts/compute-version.mjs):

1. HEAD already tagged `vX.Y.Z` → reuse it (no duplicate releases).
2. Otherwise find the newest `vX.Y.Z` tag reachable from HEAD (none → start `0.1.0`).
3. Bump from the Conventional Commits in between:
   - `type(scope)!:` in a subject **or** `BREAKING CHANGE:` in a body → **major**
   - `feat:` → **minor**
   - anything else (`fix:`, `chore:`, …) → **patch**

The release job pushes the git tag and creates a GitHub Release (set as *latest*) with commit,
image reference and run link. Image tags: `<semver>` (e.g. `1.4.2`), `<sha>` (7-char),
`latest` on main, `pr-<n>` for PRs.

## One-time cluster setup (~5 min, then forever hands-off)

### 1. Create the app Secret (API keys)

```bash
kubectl apply -f deploy/k8s/base/namespace.yaml
kubectl create secret generic eduaicompanion-secrets \
  -n eduaicompanion \
  --from-literal=GEMINI_API_KEY="..." \
  --from-literal=APP_URL="https://your-domain.example.com" \
  --from-literal=ALIBABA_API_KEY="sk-ws-..." \
  # … remaining keys, see deploy/k8s/base/secret.example.yaml
```

`APP_URL` must be the public URL users hit (your Ingress host).

### 2. Apply the base manifests

```bash
kubectl apply -k deploy/k8s/base
```

The deployment starts with the placeholder image `:0.0.0` — the first pipeline run replaces
it. (The pipeline also applies these idempotently on every deploy, so this step can be skipped
if you prefer.)

### 3. In-cluster GHCR pull access

GHCR packages are private by default, so pods need a pull secret. Two options:

- **Automatic (recommended)**: create a fine-grained GitHub PAT
  (repo: `EduAI-Companion` → *Contents: read only* + *Packages: read only*), then set the
  `GHCR_PAT` repo secret. The deploy job syncs it to the `ghcr-pull` docker-registry secret on
  every deploy — nothing to manage.
- **Manual**: `kubectl create secret docker-registry ghcr-pull -n eduaicompanion
  --docker-server=ghcr.io --docker-username=<you> --docker-password=<PAT>`

### 4. GitHub repo secrets (Settings → Secrets and variables → Actions)

| Secret | Required | Purpose |
|---|---|---|
| `KUBE_CONFIG_DATA` | yes (for deploys) | Raw `~/.kube/config` YAML for your cluster |
| `KUBE_CONTEXT` | no | Context name if the kubeconfig has several |
| `KUBE_NAMESPACE` | no | Default `eduaicompanion` |
| `GHCR_PAT` | recommended | Syncs the `ghcr-pull` imagePullSecret (see step 3) |

Until `KUBE_CONFIG_DATA` exists, the deploy job prints a notice and the pipeline stays green —
images + releases are already being produced.

### 5. (Optional) Public domain

`kubectl apply -f deploy/k8s/base/ingress.example.yaml` after editing the host, TLS issuer and
`ingressClassName` for your cluster.

## Local verification

```bash
# build the exact image the pipeline builds
docker build -t ghcr.io/zwenix/eduaicompanion:dev .
docker run --rm -p 3000:3000 --env-file .env ghcr.io/zwenix/eduaicompanion:dev
curl http://localhost:3000/api/health   # → {"status":"ok"}

# sanity-check versioning locally
node scripts/compute-version.mjs
```

## Operations

| Task | Command |
|---|---|
| Roll back | `kubectl set image deployment/eduaicompanion app=ghcr.io/zwenix/eduaicompanion:<old-semver> -n eduaicompanion` (old versions are never garbage-collected by the pipeline — every commit keeps its `<semver>` + `<sha>` tags) |
| Live logs | `kubectl logs -n eduaicompanion deploy/eduaicompanion -f` |
| Redeploy current | Re-run the workflow, or `kubectl rollout restart deployment/eduaicompanion -n eduaicompanion` |
| Scale | `kubectl scale deployment/eduaicompanion --replicas=N -n eduaicompanion` |
| Inspect versions | GitHub Releases (one per main commit) + `ghcr.io/zwenix/eduaicompanion` tags |

## Troubleshooting

- **Pod `ErrImagePull` / `ImagePullBackOff`** — `ghcr-pull` secret missing/stale: set
  `GHCR_PAT` (auto-sync) or recreate the docker-registry secret; check
  `kubectl describe pod -n eduaicompanion`.
- **Deploy skipped** — no `KUBE_CONFIG_DATA` secret; the job logs the exact setup steps.
- **Release skipped** — expected when re-running: HEAD already carries the `vX.Y.Z` tag.
- **`npm ci` failing in Docker** — the build falls back to `npm ci --ignore-scripts`
  automatically (same convention as the Android workflow).
