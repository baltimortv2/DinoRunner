# PowerShell скрипт для SSH подключения с паролем
param(
    [string]$Host = "109.172.89.107",
    [string]$User = "root",
    [string]$Password = "y=31s62uDV8e1NjEMUh1",
    [string]$Command = "echo 'SSH connection successful' && uptime"
)

# Создаем временный файл с командой
$tempScript = "ssh-temp-script.sh"
$Command | Out-File -FilePath $tempScript -Encoding ASCII

Write-Host "Подключаюсь к $User@$Host..."
Write-Host "Выполняю команду: $Command"

# Пытаемся подключиться и выполнить команду
try {
    # Используем expect-подобный подход через PowerShell
    $sshProcess = Start-Process -FilePath "ssh" -ArgumentList "-o", "StrictHostKeyChecking=no", "-o", "ConnectTimeout=10", "$User@$Host" -RedirectStandardInput $tempScript -RedirectStandardOutput "ssh-output.txt" -RedirectStandardError "ssh-error.txt" -Wait -PassThru
    
    if ($sshProcess.ExitCode -eq 0) {
        Write-Host "✅ Команда выполнена успешно"
        Get-Content "ssh-output.txt"
    } else {
        Write-Host "❌ Ошибка выполнения команды"
        Get-Content "ssh-error.txt"
    }
} catch {
    Write-Host "❌ Ошибка подключения: $_"
} finally {
    # Очищаем временные файлы
    if (Test-Path $tempScript) { Remove-Item $tempScript }
    if (Test-Path "ssh-output.txt") { Remove-Item "ssh-output.txt" }
    if (Test-Path "ssh-error.txt") { Remove-Item "ssh-error.txt" }
}