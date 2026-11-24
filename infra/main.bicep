targetScope = 'subscription'

@description('Name of the resource group for the TaskBoard environment.')
param resourceGroupName string

@description('Azure region for the resource group and platform services.')
param location string

@description('AKS cluster name.')
param clusterName string

@description('Globally unique Azure Container Registry name.')
@minLength(5)
@maxLength(50)
param acrName string

@description('Object ID of the Azure DevOps pipeline service principal.')
param pipelinePrincipalId string

param tags object = {
  application: 'taskboard'
  environment: 'demo'
  managedBy: 'bicep'
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2024-03-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module platform 'modules/platform.bicep' = {
  name: 'taskboard-platform'
  scope: resourceGroup
  params: {
    location: location
    clusterName: clusterName
    acrName: acrName
    pipelinePrincipalId: pipelinePrincipalId
    tags: tags
  }
}

output resourceGroupName string = resourceGroup.name
output clusterName string = platform.outputs.clusterName
output acrName string = platform.outputs.acrName
output acrLoginServer string = platform.outputs.acrLoginServer
