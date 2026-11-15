param([string]$ListFile, [string]$OutFile)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
$null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
$null = [Windows.Graphics.Imaging.BitmapDecoder,Windows.Graphics,ContentType=WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [Type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }
$null = [Windows.Globalization.Language,Windows.Globalization,ContentType=WindowsRuntime]
$lang = [Windows.Globalization.Language]::new('ko')
$eng = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
$out = New-Object System.IO.StreamWriter($OutFile, $false, [System.Text.Encoding]::UTF8)
foreach ($p in Get-Content $ListFile -Encoding UTF8) {
  try {
    $f = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($p)) ([Windows.Storage.StorageFile])
    $s = Await ($f.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $d = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($s)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $mx = [Math]::Max($d.PixelWidth, $d.PixelHeight); $k = [Math]::Min(3.0, 2400.0 / $mx); if ($k -lt 1) { $k = 1 }
    $tr = New-Object Windows.Graphics.Imaging.BitmapTransform
    $tr.ScaledWidth = [uint32]($d.PixelWidth * $k); $tr.ScaledHeight = [uint32]($d.PixelHeight * $k); $tr.InterpolationMode = [Windows.Graphics.Imaging.BitmapInterpolationMode]::Cubic
    $b = Await ($d.GetSoftwareBitmapAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Bgra8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Premultiplied, $tr, [Windows.Graphics.Imaging.ExifOrientationMode]::IgnoreExifOrientation, [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage)) ([Windows.Graphics.Imaging.SoftwareBitmap])
    $r = Await ($eng.RecognizeAsync($b)) ([Windows.Media.Ocr.OcrResult])
    $t = ($r.Lines | % { $_.Text }) -join ' | '
    if ($k -gt 1) { $b0 = Await ($d.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap]); $r0 = Await ($eng.RecognizeAsync($b0)) ([Windows.Media.Ocr.OcrResult]); $t = $t + ' || ' + (($r0.Lines | % { $_.Text }) -join ' | ') }
    $out.WriteLine($p + "`t" + $t)
    $s.Dispose()
  } catch { $out.WriteLine($p + "`tERR " + $_.Exception.Message) }
}
$out.Close()
