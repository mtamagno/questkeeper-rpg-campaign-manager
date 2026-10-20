[CmdletBinding()]
param(
    [switch]$RunInstall,
    [switch]$InstallNode,
    [switch]$InstallDependencies,
    [switch]$CreateManagerShortcut,
    [switch]$CreateCompanionShortcut,
    [switch]$LaunchManager,
    [ValidateSet('en', 'it')]
    [string]$Language = $(if ([Globalization.CultureInfo]::CurrentUICulture.TwoLetterISOLanguageName -eq 'it') { 'it' } else { 'en' })
)

$ErrorActionPreference = 'Stop'
$ProjectDirectory = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location -LiteralPath $ProjectDirectory

$Copy = @{
    en = @{
        Title = 'QuestKeeper Setup'
        Hero = 'Prepare your campaign workshop'
        Intro = 'QuestKeeper can prepare everything you need without asking you to use a terminal.'
        NodeReady = 'Node.js {0} is ready.'
        NodeMissing = 'Node.js 24 is required and will be installed from the official nodejs.org release.'
        NodeOld = 'Node.js {0} was found. QuestKeeper will install the supported Node.js 24 release.'
        NodeOption = 'Install Node.js 24 automatically'
        Dependencies = 'Prepare QuestKeeper files and locked dependencies'
        ManagerShortcut = 'Create a Campaign Manager desktop shortcut'
        CompanionShortcut = 'Create a Companion desktop shortcut'
        Launch = 'Open Campaign Manager when setup finishes'
        Trust = 'Node.js is downloaded only from nodejs.org and its SHA-256 checksum is verified before installation. Windows may ask for administrator approval.'
        Button = 'Prepare QuestKeeper'
        Close = 'Close'
        Ready = 'Ready to begin.'
        Working = 'Preparing QuestKeeper...'
        Success = 'QuestKeeper is ready. Your adventure can begin.'
        Failure = 'Setup could not finish. Read the log below, then try again.'
        NeedNode = 'Keep automatic Node.js installation selected to continue.'
        Language = 'Italiano'
        StepNode = 'Checking Node.js 24...'
        StepDownload = 'Downloading the official Node.js {0} installer...'
        StepChecksum = 'Verifying the Node.js installer checksum...'
        StepInstall = 'Installing Node.js 24. Confirm the Windows prompt if it appears...'
        StepDependencies = 'Installing QuestKeeper locked dependencies...'
        StepShortcuts = 'Creating desktop shortcuts...'
        StepLaunch = 'Opening Campaign Manager...'
        Finished = 'Setup completed successfully.'
    }
    it = @{
        Title = 'Installazione di QuestKeeper'
        Hero = 'Prepara il laboratorio della campagna'
        Intro = 'QuestKeeper puo'' preparare tutto il necessario senza chiederti di usare il terminale.'
        NodeReady = 'Node.js {0} e'' pronto.'
        NodeMissing = 'Serve Node.js 24: verra'' installato dalla distribuzione ufficiale nodejs.org.'
        NodeOld = 'E'' stato trovato Node.js {0}. QuestKeeper installera'' la versione Node.js 24 supportata.'
        NodeOption = 'Installa automaticamente Node.js 24'
        Dependencies = 'Prepara i file e le dipendenze bloccate di QuestKeeper'
        ManagerShortcut = 'Crea un collegamento al Campaign Manager sul desktop'
        CompanionShortcut = 'Crea un collegamento al Companion sul desktop'
        Launch = 'Apri Campaign Manager al termine del setup'
        Trust = 'Node.js viene scaricato esclusivamente da nodejs.org e il checksum SHA-256 viene verificato prima dell''installazione. Windows potrebbe chiedere l''autorizzazione di amministratore.'
        Button = 'Prepara QuestKeeper'
        Close = 'Chiudi'
        Ready = 'Tutto pronto per iniziare.'
        Working = 'Preparazione di QuestKeeper...'
        Success = 'QuestKeeper e'' pronto. L''avventura puo'' cominciare.'
        Failure = 'Il setup non e'' riuscito a terminare. Leggi il registro e riprova.'
        NeedNode = 'Lascia selezionata l''installazione automatica di Node.js per continuare.'
        Language = 'English'
        StepNode = 'Controllo di Node.js 24...'
        StepDownload = 'Download dell''installer ufficiale Node.js {0}...'
        StepChecksum = 'Verifica del checksum dell''installer Node.js...'
        StepInstall = 'Installazione di Node.js 24. Conferma la richiesta di Windows se compare...'
        StepDependencies = 'Installazione delle dipendenze bloccate di QuestKeeper...'
        StepShortcuts = 'Creazione dei collegamenti sul desktop...'
        StepLaunch = 'Apertura di Campaign Manager...'
        Finished = 'Installazione completata correttamente.'
    }
}

function Get-Text([string]$Key, [object[]]$Values = @()) {
    $value = $Copy[$Language][$Key]
    if ($Values.Count -gt 0) { return $value -f $Values }
    return $value
}

function Get-NodeExecutable {
    $command = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }
    $standardPath = Join-Path $env:ProgramFiles 'nodejs\node.exe'
    if (Test-Path -LiteralPath $standardPath) { return $standardPath }
    return $null
}

function Get-NodeVersion {
    $node = Get-NodeExecutable
    if (-not $node) { return $null }
    try { return (& $node --version).TrimStart('v') } catch { return $null }
}

function Test-SupportedNode {
    $version = Get-NodeVersion
    if (-not $version) { return $false }
    return ([version]$version).Major -eq 24
}

function Refresh-ProcessPath {
    $machinePath = [Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
    $env:Path = @($machinePath, $userPath) -join ';'
}

function Install-OfficialNode24 {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Write-Output (Get-Text 'StepNode')
    if (Test-SupportedNode) {
        Write-Output (Get-Text 'NodeReady' @((Get-NodeVersion)))
        return
    }

    $architecture = switch ([Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString()) {
        'Arm64' { 'arm64' }
        'X86' { 'x86' }
        default { 'x64' }
    }
    $releases = Invoke-RestMethod -Uri 'https://nodejs.org/dist/index.json'
    $release = $releases | Where-Object { $_.version -match '^v24\.' } | Select-Object -First 1
    if (-not $release) { throw 'The official Node.js 24 release index returned no compatible version.' }
    $requiredArtifact = "win-$architecture-msi"
    if ($release.files -notcontains $requiredArtifact) {
        throw "Node.js $($release.version) does not provide $requiredArtifact."
    }

    $version = $release.version
    $fileName = "node-$version-$architecture.msi"
    $baseUrl = "https://nodejs.org/dist/$version"
    $temporaryDirectory = Join-Path ([IO.Path]::GetTempPath()) "QuestKeeper-Node24-$([Guid]::NewGuid().ToString('N'))"
    $installerPath = Join-Path $temporaryDirectory $fileName
    New-Item -ItemType Directory -Path $temporaryDirectory | Out-Null

    try {
        Write-Output (Get-Text 'StepDownload' @($version))
        Invoke-WebRequest -Uri "$baseUrl/$fileName" -OutFile $installerPath -UseBasicParsing
        Write-Output (Get-Text 'StepChecksum')
        $checksumDocument = (Invoke-WebRequest -Uri "$baseUrl/SHASUMS256.txt" -UseBasicParsing).Content
        $escapedFileName = [regex]::Escape($fileName)
        $checksumLine = ($checksumDocument -split "`n") | Where-Object { $_ -match "(?i)^[a-f0-9]{64}\s+\*?$escapedFileName\s*$" } | Select-Object -First 1
        if (-not $checksumLine) { throw "No official checksum was published for $fileName." }
        $expectedHash = ($checksumLine.Trim() -split '\s+')[0].ToUpperInvariant()
        $actualHash = (Get-FileHash -LiteralPath $installerPath -Algorithm SHA256).Hash.ToUpperInvariant()
        if ($actualHash -ne $expectedHash) { throw 'The downloaded Node.js installer failed SHA-256 verification.' }

        Write-Output (Get-Text 'StepInstall')
        $installer = Start-Process -FilePath 'msiexec.exe' -ArgumentList @('/i', "`"$installerPath`"", '/qn', '/norestart') -Verb RunAs -Wait -PassThru
        if ($installer.ExitCode -notin @(0, 3010)) { throw "Node.js installation exited with code $($installer.ExitCode)." }
    }
    finally {
        if (Test-Path -LiteralPath $temporaryDirectory) {
            Remove-Item -LiteralPath $temporaryDirectory -Recurse -Force
        }
    }

    Refresh-ProcessPath
    if (-not (Test-SupportedNode)) { throw 'Node.js was installed, but this session could not find it. Restart Windows and run setup again.' }
    Write-Output (Get-Text 'NodeReady' @((Get-NodeVersion)))
}

function Install-LockedDependencies {
    Write-Output (Get-Text 'StepDependencies')
    $npm = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if (-not $npm) {
        $npmPath = Join-Path $env:ProgramFiles 'nodejs\npm.cmd'
        if (Test-Path -LiteralPath $npmPath) { $npm = Get-Item -LiteralPath $npmPath }
    }
    if (-not $npm) { throw 'npm was not found after installing Node.js.' }
    & $npm.FullName ci
    if ($LASTEXITCODE -ne 0) { throw "npm ci exited with code $LASTEXITCODE." }
}

function New-QuestKeeperShortcut([string]$Name, [string]$Launcher, [string]$Description) {
    $desktop = [Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktop "$Name.lnk"
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $ProjectDirectory $Launcher
    $shortcut.WorkingDirectory = $ProjectDirectory
    $shortcut.Description = $Description
    $shortcut.Save()
}

function Invoke-SetupInstall {
    if ($InstallNode) { Install-OfficialNode24 }
    if (-not (Test-SupportedNode)) { throw (Get-Text 'NeedNode') }
    if ($InstallDependencies) { Install-LockedDependencies }
    if ($CreateManagerShortcut -or $CreateCompanionShortcut) {
        Write-Output (Get-Text 'StepShortcuts')
        if ($CreateManagerShortcut) {
            New-QuestKeeperShortcut 'QuestKeeper Campaign Manager' 'launch-manager.bat' 'Open the local QuestKeeper Campaign Manager'
        }
        if ($CreateCompanionShortcut) {
            New-QuestKeeperShortcut 'QuestKeeper Companion' 'launch-companion.bat' 'Open the local QuestKeeper player Companion'
        }
    }
    Write-Output (Get-Text 'Finished')
    if ($LaunchManager) {
        Write-Output (Get-Text 'StepLaunch')
        Start-Process -FilePath (Join-Path $ProjectDirectory 'launch-manager.bat') -WorkingDirectory $ProjectDirectory
    }
}

function Show-SetupWindow {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing
    [Windows.Forms.Application]::EnableVisualStyles()

    $form = New-Object Windows.Forms.Form
    $form.Text = Get-Text 'Title'
    $form.StartPosition = 'CenterScreen'
    $form.ClientSize = New-Object Drawing.Size(760, 690)
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $form.BackColor = [Drawing.Color]::FromArgb(20, 18, 27)
    $form.ForeColor = [Drawing.Color]::FromArgb(235, 225, 202)
    $form.Font = New-Object Drawing.Font('Segoe UI', 10)

    $title = New-Object Windows.Forms.Label
    $title.AutoSize = $false
    $title.Location = New-Object Drawing.Point(42, 30)
    $title.Size = New-Object Drawing.Size(570, 42)
    $title.Text = Get-Text 'Hero'
    $title.Font = New-Object Drawing.Font('Georgia', 21, [Drawing.FontStyle]::Bold)
    $title.ForeColor = [Drawing.Color]::FromArgb(224, 184, 91)
    $form.Controls.Add($title)

    $intro = New-Object Windows.Forms.Label
    $intro.Location = New-Object Drawing.Point(45, 78)
    $intro.Size = New-Object Drawing.Size(650, 44)
    $intro.Text = Get-Text 'Intro'
    $intro.ForeColor = [Drawing.Color]::FromArgb(196, 188, 175)
    $form.Controls.Add($intro)

    $languageButton = New-Object Windows.Forms.Button
    $languageButton.Location = New-Object Drawing.Point(628, 30)
    $languageButton.Size = New-Object Drawing.Size(88, 34)
    $languageButton.Text = Get-Text 'Language'
    $languageButton.FlatStyle = 'Flat'
    $languageButton.FlatAppearance.BorderColor = [Drawing.Color]::FromArgb(116, 92, 56)
    $languageButton.ForeColor = [Drawing.Color]::FromArgb(235, 225, 202)
    $languageButton.Add_Click({
        $nextLanguage = if ($Language -eq 'it') { 'en' } else { 'it' }
        Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-STA', '-File', "`"$PSCommandPath`"", '-Language', $nextLanguage)
        $form.Close()
    })
    $form.Controls.Add($languageButton)

    $panel = New-Object Windows.Forms.Panel
    $panel.Location = New-Object Drawing.Point(42, 132)
    $panel.Size = New-Object Drawing.Size(674, 286)
    $panel.BackColor = [Drawing.Color]::FromArgb(31, 28, 39)
    $panel.BorderStyle = 'FixedSingle'
    $form.Controls.Add($panel)

    $nodeVersion = Get-NodeVersion
    $nodeSupported = Test-SupportedNode
    $nodeStatus = New-Object Windows.Forms.Label
    $nodeStatus.Location = New-Object Drawing.Point(22, 20)
    $nodeStatus.Size = New-Object Drawing.Size(625, 42)
    $nodeStatus.Font = New-Object Drawing.Font('Segoe UI Semibold', 10)
    if ($nodeSupported) {
        $nodeStatus.Text = Get-Text 'NodeReady' @($nodeVersion)
        $nodeStatus.ForeColor = [Drawing.Color]::FromArgb(126, 201, 158)
    } elseif ($nodeVersion) {
        $nodeStatus.Text = Get-Text 'NodeOld' @($nodeVersion)
        $nodeStatus.ForeColor = [Drawing.Color]::FromArgb(239, 183, 91)
    } else {
        $nodeStatus.Text = Get-Text 'NodeMissing'
        $nodeStatus.ForeColor = [Drawing.Color]::FromArgb(239, 183, 91)
    }
    $panel.Controls.Add($nodeStatus)

    function Add-Option([string]$Text, [int]$Top, [bool]$Checked, [bool]$Enabled = $true) {
        $option = New-Object Windows.Forms.CheckBox
        $option.Location = New-Object Drawing.Point(22, $Top)
        $option.Size = New-Object Drawing.Size(625, 30)
        $option.Text = $Text
        $option.Checked = $Checked
        $option.Enabled = $Enabled
        $option.FlatStyle = 'Flat'
        $option.ForeColor = [Drawing.Color]::FromArgb(225, 216, 198)
        $panel.Controls.Add($option)
        return $option
    }

    $nodeOption = Add-Option (Get-Text 'NodeOption') 68 (-not $nodeSupported) (-not $nodeSupported)
    $dependencyOption = Add-Option (Get-Text 'Dependencies') 106 $true
    $managerShortcutOption = Add-Option (Get-Text 'ManagerShortcut') 144 $true
    $companionShortcutOption = Add-Option (Get-Text 'CompanionShortcut') 182 $true
    $launchOption = Add-Option (Get-Text 'Launch') 220 $true

    $trust = New-Object Windows.Forms.Label
    $trust.Location = New-Object Drawing.Point(45, 432)
    $trust.Size = New-Object Drawing.Size(670, 48)
    $trust.Text = Get-Text 'Trust'
    $trust.ForeColor = [Drawing.Color]::FromArgb(164, 157, 149)
    $form.Controls.Add($trust)

    $progress = New-Object Windows.Forms.ProgressBar
    $progress.Location = New-Object Drawing.Point(46, 488)
    $progress.Size = New-Object Drawing.Size(666, 8)
    $progress.Style = 'Blocks'
    $form.Controls.Add($progress)

    $status = New-Object Windows.Forms.Label
    $status.Location = New-Object Drawing.Point(45, 508)
    $status.Size = New-Object Drawing.Size(666, 28)
    $status.Text = Get-Text 'Ready'
    $status.Font = New-Object Drawing.Font('Segoe UI Semibold', 10)
    $form.Controls.Add($status)

    $log = New-Object Windows.Forms.TextBox
    $log.Location = New-Object Drawing.Point(45, 540)
    $log.Size = New-Object Drawing.Size(666, 76)
    $log.Multiline = $true
    $log.ReadOnly = $true
    $log.ScrollBars = 'Vertical'
    $log.BackColor = [Drawing.Color]::FromArgb(12, 11, 17)
    $log.ForeColor = [Drawing.Color]::FromArgb(193, 190, 202)
    $log.BorderStyle = 'FixedSingle'
    $form.Controls.Add($log)

    $prepareButton = New-Object Windows.Forms.Button
    $prepareButton.Location = New-Object Drawing.Point(436, 632)
    $prepareButton.Size = New-Object Drawing.Size(184, 40)
    $prepareButton.Text = Get-Text 'Button'
    $prepareButton.FlatStyle = 'Flat'
    $prepareButton.BackColor = [Drawing.Color]::FromArgb(132, 86, 39)
    $prepareButton.ForeColor = [Drawing.Color]::White
    $prepareButton.FlatAppearance.BorderColor = [Drawing.Color]::FromArgb(224, 184, 91)
    $form.Controls.Add($prepareButton)

    $closeButton = New-Object Windows.Forms.Button
    $closeButton.Location = New-Object Drawing.Point(628, 632)
    $closeButton.Size = New-Object Drawing.Size(84, 40)
    $closeButton.Text = Get-Text 'Close'
    $closeButton.FlatStyle = 'Flat'
    $closeButton.FlatAppearance.BorderColor = [Drawing.Color]::FromArgb(92, 82, 104)
    $closeButton.ForeColor = [Drawing.Color]::FromArgb(225, 216, 198)
    $closeButton.Add_Click({ $form.Close() })
    $form.Controls.Add($closeButton)
    $form.AcceptButton = $prepareButton
    $form.CancelButton = $closeButton

    $timer = New-Object Windows.Forms.Timer
    $timer.Interval = 400
    $script:setupProcess = $null
    $script:stdoutPath = $null
    $script:stderrPath = $null

    $timer.Add_Tick({
        $content = @()
        if ($script:stdoutPath -and (Test-Path -LiteralPath $script:stdoutPath)) { $content += Get-Content -LiteralPath $script:stdoutPath }
        if ($script:stderrPath -and (Test-Path -LiteralPath $script:stderrPath)) { $content += Get-Content -LiteralPath $script:stderrPath }
        $log.Text = ($content -join [Environment]::NewLine)
        $log.SelectionStart = $log.TextLength
        $log.ScrollToCaret()
        if ($script:setupProcess -and $script:setupProcess.HasExited) {
            $timer.Stop()
            $progress.Style = 'Blocks'
            $progress.Value = if ($script:setupProcess.ExitCode -eq 0) { 100 } else { 0 }
            $status.Text = if ($script:setupProcess.ExitCode -eq 0) { Get-Text 'Success' } else { Get-Text 'Failure' }
            $status.ForeColor = if ($script:setupProcess.ExitCode -eq 0) { [Drawing.Color]::FromArgb(126, 201, 158) } else { [Drawing.Color]::FromArgb(234, 118, 118) }
            $prepareButton.Enabled = $true
            $closeButton.Enabled = $true
        }
    })

    $prepareButton.Add_Click({
        if (-not $nodeSupported -and -not $nodeOption.Checked) {
            [Windows.Forms.MessageBox]::Show((Get-Text 'NeedNode'), (Get-Text 'Title'), 'OK', 'Warning') | Out-Null
            return
        }
        $arguments = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', "`"$PSCommandPath`"", '-RunInstall', '-Language', $Language)
        if ($nodeOption.Checked) { $arguments += '-InstallNode' }
        if ($dependencyOption.Checked) { $arguments += '-InstallDependencies' }
        if ($managerShortcutOption.Checked) { $arguments += '-CreateManagerShortcut' }
        if ($companionShortcutOption.Checked) { $arguments += '-CreateCompanionShortcut' }
        if ($launchOption.Checked) { $arguments += '-LaunchManager' }
        $script:stdoutPath = [IO.Path]::GetTempFileName()
        $script:stderrPath = [IO.Path]::GetTempFileName()
        $script:setupProcess = Start-Process -FilePath 'powershell.exe' -ArgumentList $arguments -WindowStyle Hidden -RedirectStandardOutput $script:stdoutPath -RedirectStandardError $script:stderrPath -PassThru
        $prepareButton.Enabled = $false
        $closeButton.Enabled = $false
        $status.Text = Get-Text 'Working'
        $status.ForeColor = [Drawing.Color]::FromArgb(224, 184, 91)
        $progress.Style = 'Marquee'
        $timer.Start()
    })

    $form.Add_FormClosed({
        $timer.Stop()
        foreach ($path in @($script:stdoutPath, $script:stderrPath)) {
            if ($path -and (Test-Path -LiteralPath $path)) { Remove-Item -LiteralPath $path -Force }
        }
    })
    $form.Add_FormClosing({
        if ($script:setupProcess -and -not $script:setupProcess.HasExited) {
            $_.Cancel = $true
        }
    })
    [void]$form.ShowDialog()
}

if ($RunInstall) {
    try {
        Invoke-SetupInstall
        exit 0
    }
    catch {
        Write-Error $_.Exception.Message
        exit 1
    }
}

Show-SetupWindow
