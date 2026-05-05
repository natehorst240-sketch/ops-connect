<#
.SYNOPSIS
  Deploy MX Connect Phase 1 solution to a target Power Platform environment.

.DESCRIPTION
  Imports the MXConnect solution into the named environment, sets up
  connection references, and seeds environment variables. Run this from
  inside `m365-solution/Phase1/`.

  Prereqs:
    - pac CLI installed: `dotnet tool install --global Microsoft.PowerApps.CLI.Tool`
    - Authenticated: `pac auth create --name <profile> --environment <url>`
    - Solution exists in your Dev environment and you've exported it via
      `pac solution export --name MXConnect --path ./MXConnect.zip`

.PARAMETER Environment
  Target environment auth profile name. Must already exist in `pac auth list`.

.PARAMETER SolutionPath
  Path to the exported solution.zip. Defaults to ./MXConnect.zip.

.PARAMETER Managed
  Import as managed (production) vs unmanaged (dev/uat).

.EXAMPLE
  .\deploy.ps1 -Environment uat -SolutionPath .\MXConnect.zip

.EXAMPLE
  .\deploy.ps1 -Environment prod -SolutionPath .\MXConnect-managed.zip -Managed
#>

param (
    [Parameter(Mandatory=$true)]
    [string]$Environment,

    [Parameter(Mandatory=$false)]
    [string]$SolutionPath = ".\MXConnect.zip",

    [Parameter(Mandatory=$false)]
    [switch]$Managed
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== MX Connect Phase 1 Deploy ===" -ForegroundColor Cyan
Write-Host "  Target environment : $Environment"
Write-Host "  Solution path      : $SolutionPath"
Write-Host "  Managed            : $Managed"
Write-Host ""

# 1. Confirm solution.zip exists
if (-not (Test-Path $SolutionPath)) {
    Write-Error "Solution file not found at $SolutionPath. Export from Dev first:"
    Write-Error "  pac auth select --name dev"
    Write-Error "  pac solution export --name MXConnect --path $SolutionPath"
    exit 1
}

# 2. Switch auth profile
Write-Host "[1/4] Switching to $Environment auth profile…" -ForegroundColor Yellow
pac auth select --name $Environment
if ($LASTEXITCODE -ne 0) {
    Write-Error "Auth profile '$Environment' not found. Create it first:"
    Write-Error "  pac auth create --name $Environment --environment <env-url>"
    exit 1
}

# 3. Import solution
Write-Host "[2/4] Importing solution…" -ForegroundColor Yellow
if ($Managed) {
    pac solution import --path $SolutionPath --activate-plugins --import-as-holding
} else {
    pac solution import --path $SolutionPath
}
if ($LASTEXITCODE -ne 0) {
    Write-Error "Solution import failed. See output above."
    exit 1
}

# 4. Reminder for connection references
Write-Host "[3/4] Connection references…" -ForegroundColor Yellow
Write-Host "  Connection references must be set in the Power Platform admin" -ForegroundColor Gray
Write-Host "  center (Solutions > MXConnect > Connection references) before" -ForegroundColor Gray
Write-Host "  the flow can run. The kit needs three connections:" -ForegroundColor Gray
Write-Host "    - cr_DataverseConnection (Dataverse)" -ForegroundColor Gray
Write-Host "    - cr_TeamsConnection (Microsoft Teams)" -ForegroundColor Gray
Write-Host "    - cr_OutlookConnection (Office 365 Outlook)" -ForegroundColor Gray
Write-Host ""

# 5. Reminder for environment variables
Write-Host "[4/4] Environment variables…" -ForegroundColor Yellow
Write-Host "  Update these in Solutions > MXConnect > Environment variables:" -ForegroundColor Gray
Write-Host "    - cr_approver_team_id" -ForegroundColor Gray
Write-Host "    - cr_approver_channel_id" -ForegroundColor Gray
Write-Host "    - cr_outlook_calendar" -ForegroundColor Gray
Write-Host "    - cr_request_timeout_hours" -ForegroundColor Gray
Write-Host "    - cr_audit_retention_days" -ForegroundColor Gray
Write-Host "    - cr_app_deeplink_base" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Deploy complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Authenticate connection references in the admin center"
Write-Host "  2. Set the six environment variables for this environment"
Write-Host "  3. Turn on the flow (off by default after import)"
Write-Host "  4. Run the smoke test from runbook.md § Week 4.5"
Write-Host ""
