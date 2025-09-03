# Интерактивный SSH скрипт для PowerShell
param(
    [string]$Host = "109.172.89.107",
    [string]$User = "root",
    [string]$Password = "y=31s62uDV8e1NjEMUh1"
)

Write-Host "🔌 Подключаюсь к $User@$Host..."

# Создаем процесс SSH
$sshProcess = Start-Process -FilePath "ssh" -ArgumentList "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", "$User@$Host" -RedirectStandardInput "ssh-input.txt" -RedirectStandardOutput "ssh-output.txt" -RedirectStandardError "ssh-error.txt" -NoNewWindow -Wait -PassThru

Write-Host "SSH процесс завершен с кодом: $($sshProcess.ExitCode)"

# Показываем результаты
if (Test-Path "ssh-output.txt") {
    Write-Host "📤 Вывод команды:"
    Get-Content "ssh-output.txt"
}

if (Test-Path "ssh-error.txt") {
    Write-Host "❌ Ошибки:"
    Get-Content "ssh-error.txt"
}

# Очищаем временные файлы
if (Test-Path "ssh-input.txt") { Remove-Item "ssh-input.txt" }
if (Test-Path "ssh-output.txt") { Remove-Item "ssh-output.txt" }
if (Test-Path "ssh-error.txt") { Remove-Item "ssh-error.txt" }