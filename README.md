# TaskBoard on Azure

A portfolio starter for a cloud-native task manager built with ASP.NET Core and React, containerized with Docker, deployed to AKS with Helm, and provisioned with Bicep. Azure DevOps YAML pipelines validate pull requests, build and publish images to Azure Container Registry (ACR), and deploy the application to AKS.

## Architecture

```text
Browser
  |
  v
NGINX Ingress Controller (public LoadBalancer)
  | /api/*                    | /*
  v                           v
TaskBoard API (ASP.NET Core)  TaskBoard UI (React + NGINX)
  |                           |
  +---- in-memory task store -+

Azure DevOps -> Docker build -> ACR -> AKS (Helm)
                                      ^
Bicep -> Resource Group, AKS, ACR, Log Analytics, RBAC
```

The API uses an in-memory store so the demo runs without a database. Tasks reset when the API pod restarts; this is intentional for a focused platform demo, not production persistence.

## Repository layout

| Path | Purpose |
| --- | --- |
| `api/` | ASP.NET Core API and unit tests |
| `web/` | React/Vite user interface |
| `infra/` | Subscription-scoped Bicep to provision Azure infrastructure |
| `deploy/helm/taskboard/` | Kubernetes Deployments, Services, probes, and ingress |
| `azure-pipelines.yml` | PR validation and main-branch application delivery |
| `azure-pipelines-infra.yml` | Manually queued Bicep infrastructure deployment |
| `compose.yaml` | Local multi-container run |

## Run locally

Requirements: .NET 10 SDK, Node.js 20+, and Docker with Compose.

```sh
docker compose up --build
```

Open `http://localhost:8081`. The API is available at `http://localhost:8080`; health endpoints are `/health/live` and `/health/ready`.

To run checks without Docker:

```sh
dotnet test api/TaskBoard.sln
cd web && npm ci && npm run build
```

## Azure DevOps setup

1. Push this repository to GitHub or Azure Repos and create an Azure DevOps project.
2. Connect the repository to Azure DevOps and create a pipeline from `azure-pipelines.yml`.
3. Create a variable group named `taskboard-platform` and authorize it for these pipelines.
4. Add the values listed below. Keep credentials in Azure DevOps service connections or secret variables, never in YAML.
5. Create an Azure Resource Manager service connection with workload identity federation if supported by your Azure DevOps organization. Name it `azure-platform`; grant only the required scoped roles.
6. Queue `azure-pipelines-infra.yml` manually once to provision Azure resources.
7. Create the Azure DevOps environment `taskboard-dev` and add deployment approvals/checks if desired.
8. Configure DNS to point `appHostName` to the ingress controller's external IP, then run the application pipeline on `main`.

Required variable group values:

| Variable | Example | Notes |
| --- | --- | --- |
| `azureServiceConnection` | `azure-platform` | Azure Resource Manager service connection name |
| `resourceGroupName` | `rg-taskboard-dev` | Resource group provisioned by Bicep |
| `location` | `eastus` | Azure region supporting the selected AKS VM size |
| `clusterName` | `aks-taskboard-dev` | AKS resource name |
| `acrName` | `taskboarddemo123` | Globally unique ACR name, 5-50 lowercase alphanumeric characters |
| `azurePipelinePrincipalId` | `00000000-...` | Object ID of the service principal used by the Azure service connection |
| `appHostName` | `tasks.example.com` | DNS name routed to the ingress public IP |

The Bicep deployment assigns the pipeline principal AKS Cluster User, Kubernetes RBAC Writer, and ACR Push roles, and grants the AKS kubelet identity ACR pull access. The service connection also needs permission to create the resource group, AKS, ACR, Log Analytics, and those role assignments at the subscription/resource-group scopes. Review `infra/` and use the Bicep what-if output before provisioning in a real subscription.

The infra pipeline is manual because AKS incurs ongoing Azure charges. Destroy the resource group when finished with the demo:

```sh
az group delete --name rg-taskboard-dev --yes --no-wait
```

## Pipelines

- Pull requests to `main` run .NET tests/build, frontend dependency install/build, Docker image builds, Helm lint/template checks, and Bicep compilation. They do not authenticate to Azure or deploy.
- A successful push to `main` builds and pushes commit-tagged API/UI images to ACR, installs the NGINX ingress controller if needed, and deploys the Helm release.
- The infrastructure pipeline runs only when manually queued and performs a subscription-scope Bicep deployment.
- The first deployment requires the infrastructure pipeline first. Subsequent application pushes deploy without reprovisioning infrastructure.

## Kubernetes operations

```sh
az aks install-cli
AKS_ID=$(az aks show --resource-group rg-taskboard-dev --name aks-taskboard-dev --query id --output tsv)
az role assignment create --assignee <your-entra-object-id> --scope "$AKS_ID" --role "Azure Kubernetes Service Cluster User Role"
az role assignment create --assignee <your-entra-object-id> --scope "$AKS_ID" --role "Azure Kubernetes Service RBAC Writer"
az aks get-credentials --resource-group rg-taskboard-dev --name aks-taskboard-dev
kubectl get pods,services,ingress --namespace taskboard
helm history taskboard --namespace taskboard
helm rollback taskboard 1 --namespace taskboard
```

The sample exposes HTTP ingress for demonstration. Add TLS (for example cert-manager with a DNS name) before using it outside a demo environment. The API has readiness and liveness endpoints, non-root container execution, resource requests/limits, and rolling deployments. Add persistent storage or a managed database before treating task data as durable.

## Push to GitHub

The empty public repository `IshaliSandbhor/Azure_ci-cd` is ready for this project. From the project directory:

```sh
git remote add origin https://github.com/IshaliSandbhor/Azure_ci-cd.git
git add .
git commit -m "Initial TaskBoard Azure platform"
git push -u origin main
```

Do not add service principal secrets, kubeconfigs, publish profiles, or Azure credentials to the repository.
