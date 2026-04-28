$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root "public/icons"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

function New-RoundedRectPath {
  param(
    [float] $X,
    [float] $Y,
    [float] $Width,
    [float] $Height,
    [float] $Radius
  )

  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $diameter = $Radius * 2
  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Color {
  param(
    [int] $A,
    [int] $R,
    [int] $G,
    [int] $B
  )

  return [System.Drawing.Color]::FromArgb($A, $R, $G, $B)
}

function Draw-MasterIcon {
  $size = 512
  $bitmap = [System.Drawing.Bitmap]::new($size, $size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit

  $backgroundPath = New-RoundedRectPath 34 34 444 444 108
  $backgroundBrush = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    [System.Drawing.RectangleF]::new(34, 34, 444, 444),
    (New-Color 255 18 88 219),
    (New-Color 255 17 191 165),
    [System.Drawing.Drawing2D.LinearGradientMode]::ForwardDiagonal
  )
  $graphics.FillPath($backgroundBrush, $backgroundPath)

  $highlightBrush = [System.Drawing.SolidBrush]::new((New-Color 38 255 255 255))
  $graphics.FillEllipse($highlightBrush, 78, 54, 260, 150)

  $shadowBrush = [System.Drawing.SolidBrush]::new((New-Color 45 0 22 64))
  $graphics.FillPath($shadowBrush, (New-RoundedRectPath 126 154 200 224 34))
  $graphics.FillPath($shadowBrush, (New-RoundedRectPath 218 182 204 228 36))

  $backCardBrush = [System.Drawing.SolidBrush]::new((New-Color 230 240 249 255))
  $frontCardBrush = [System.Drawing.SolidBrush]::new((New-Color 250 255 255 255))
  $graphics.FillPath($backCardBrush, (New-RoundedRectPath 108 134 204 224 34))
  $graphics.FillPath($frontCardBrush, (New-RoundedRectPath 200 164 212 232 36))

  $inkBrush = [System.Drawing.SolidBrush]::new((New-Color 255 14 42 91))
  $mutedBrush = [System.Drawing.SolidBrush]::new((New-Color 255 83 112 154))
  $accentBrush = [System.Drawing.SolidBrush]::new((New-Color 255 246 184 64))
  $tealBrush = [System.Drawing.SolidBrush]::new((New-Color 255 20 164 142))

  $font = [System.Drawing.Font]::new("Segoe UI Semibold", 132, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.DrawString("A", $font, $inkBrush, 146, 184)

  $linePen1 = [System.Drawing.Pen]::new((New-Color 255 14 42 91), 22)
  $linePen1.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linePen1.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linePen2 = [System.Drawing.Pen]::new((New-Color 255 20 164 142), 22)
  $linePen2.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linePen2.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linePen3 = [System.Drawing.Pen]::new((New-Color 255 83 112 154), 18)
  $linePen3.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $linePen3.EndCap = [System.Drawing.Drawing2D.LineCap]::Round

  $graphics.DrawLine($linePen1, 246, 234, 350, 234)
  $graphics.DrawLine($linePen2, 246, 284, 366, 284)
  $graphics.DrawLine($linePen3, 246, 334, 326, 334)
  $graphics.FillEllipse($accentBrush, 348, 324, 34, 34)

  $arrowPen = [System.Drawing.Pen]::new((New-Color 255 246 184 64), 18)
  $arrowPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $arrowPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $arrowCap = [System.Drawing.Drawing2D.AdjustableArrowCap]::new(8, 10, $true)
  $arrowPen.CustomEndCap = $arrowCap
  $graphics.DrawBezier($arrowPen, 165, 368, 212, 414, 282, 414, 340, 378)

  $miniPen = [System.Drawing.Pen]::new((New-Color 255 255 255 255), 16)
  $miniPen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $miniPen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $graphics.DrawLine($miniPen, 98, 94, 172, 94)
  $graphics.DrawLine($miniPen, 98, 124, 146, 124)

  $font.Dispose()
  $linePen1.Dispose()
  $linePen2.Dispose()
  $linePen3.Dispose()
  $arrowPen.Dispose()
  $miniPen.Dispose()
  $backgroundBrush.Dispose()
  $highlightBrush.Dispose()
  $shadowBrush.Dispose()
  $backCardBrush.Dispose()
  $frontCardBrush.Dispose()
  $inkBrush.Dispose()
  $mutedBrush.Dispose()
  $accentBrush.Dispose()
  $tealBrush.Dispose()
  $backgroundPath.Dispose()
  $graphics.Dispose()

  return $bitmap
}

function Save-ScaledIcon {
  param(
    [System.Drawing.Bitmap] $Master,
    [int] $Size
  )

  $bitmap = [System.Drawing.Bitmap]::new($Size, $Size, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $bitmap.SetResolution(96, 96)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $graphics.DrawImage($Master, 0, 0, $Size, $Size)
  $target = Join-Path $outDir "icon-$Size.png"
  $bitmap.Save($target, [System.Drawing.Imaging.ImageFormat]::Png)
  $graphics.Dispose()
  $bitmap.Dispose()
}

$master = Draw-MasterIcon
foreach ($size in @(16, 32, 48, 128, 256)) {
  Save-ScaledIcon $master $size
}
$master.Dispose()
