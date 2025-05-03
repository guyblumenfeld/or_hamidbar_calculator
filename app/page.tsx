"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Trash2, Plus, Download, Printer } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"
// Note: html2canvas and jspdf are dynamically imported in the downloadPDF function

interface Ingredient {
  name: string
  percentage: number
}

export default function OilCalculator() {
  const [recipeName, setRecipeName] = useState<string>("")
  const [units, setUnits] = useState<number>(1)
  const [sizePerUnit, setSizePerUnit] = useState<number>(100)
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { name: "שמן זית", percentage: 60 },
    { name: "שמן לבנדר", percentage: 40 },
  ])
  const [totalPercentage, setTotalPercentage] = useState<number>(100)
  const [totalVolume, setTotalVolume] = useState<number>(100)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Calculate total percentage
    const total = ingredients.reduce((sum, ingredient) => sum + (ingredient.percentage || 0), 0)
    setTotalPercentage(total)

    // Calculate total volume
    setTotalVolume(units * sizePerUnit)

    // Check if percentages add up to 100%
    if (total > 100) {
      setError(`הסך הכולל שהזנת הוא ${total}% אנא הפחת חלק מהאחוזים.`)
    } else if (total < 100 && ingredients.length > 0) {
      setError(`הסך הכולל שהזנת הוא ${total}% אנא הוסף עוד אחוזים.`)
    } else {
      setError(null)
    }
  }, [ingredients, units, sizePerUnit])

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", percentage: 0 }])
  }

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...ingredients]
    newIngredients.splice(index, 1)
    setIngredients(newIngredients)
  }

  const handleIngredientChange = (index: number, field: keyof Ingredient, value: string) => {
    const newIngredients = [...ingredients]
    if (field === "percentage") {
      newIngredients[index][field] = Number.parseFloat(value) || 0
    } else {
      newIngredients[index][field] = value as string
    }
    setIngredients(newIngredients)
  }

  const calculateVolume = (percentage: number): number => {
    return (percentage / 100) * totalVolume
  }

  const downloadPDF = async () => {
    try {
      // Create a hidden div to render the recipe content
      const printElement = document.createElement("div")
      printElement.style.width = "210mm"
      printElement.style.padding = "20mm"
      printElement.style.position = "absolute"
      printElement.style.left = "-9999px"
      printElement.style.top = "-9999px"
      printElement.dir = "rtl"
      printElement.style.fontFamily = "Arial, sans-serif"

      const title = recipeName || "מתכון שמן"

      // Create the content HTML
      printElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="/images/oilsisrael-logo.png" alt="אור המדבר" style="max-width: 200px;">
        </div>
        <h1 style="text-align: center; margin-bottom: 20px;">${title}</h1>
        
        <div style="margin-bottom: 30px;">
          <p><strong>מספר יחידות:</strong> ${units}</p>
          <p><strong>גודל ליחידה:</strong> ${sizePerUnit} מ"ל</p>
          <p><strong>נפח כולל:</strong> ${totalVolume} מ"ל</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2>מרכיבים:</h2>
          ${ingredients
            .filter((ing) => ing.name)
            .map(
              (ing) => `
              <div style="margin: 5px 0;">
                <strong>${ing.name}:</strong> ${calculateVolume(ing.percentage).toFixed(1)} מ"ל (${ing.percentage}%)
              </div>
            `,
            )
            .join("")}
        </div>
        
        <div style="font-size: 12px; margin-top: 30px; border-top: 1px solid #ccc; padding-top: 10px;">
          <p>*אין לאור המדבר אחריות על המתכונים המחושבים באמצעות המחשבון ואין לראות באמור המלצה או תחליף לייעוץ רפואי</p>
        </div>
        
        <div style="margin-top: 10px;">
          <p>נוצר בתאריך ${new Date().toLocaleDateString("he-IL")}</p>
        </div>
      `

      document.body.appendChild(printElement)

      // Use html2canvas to capture the content as an image
      const { default: html2canvas } = await import("html2canvas")
      const canvas = await html2canvas(printElement, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      })

      document.body.removeChild(printElement)

      // Create PDF from the canvas
      const { default: jsPDF } = await import("jspdf")
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = 210 // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)
      pdf.save(`${title.replace(/\s+/g, "-")}.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("אירעה שגיאה בעת יצירת ה-PDF. אנא נסה שוב מאוחר יותר.")
    }
  }

  const printRecipe = () => {
    const title = recipeName || "מתכון שמן"

    // Create a hidden iframe
    const iframe = document.createElement("iframe")
    iframe.style.display = "none"
    document.body.appendChild(iframe)

    // Write the print content to the iframe
    iframe.contentDocument.write(`
      <html dir="rtl">
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
              direction: rtl;
            }
            .logo {
              text-align: center;
              margin-bottom: 20px;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
            }
            .recipe-details {
              margin-bottom: 30px;
            }
            .ingredients {
              margin-bottom: 30px;
            }
            .ingredient {
              margin: 5px 0;
            }
            .disclaimer {
              font-size: 12px;
              margin-top: 30px;
              border-top: 1px solid #ccc;
              padding-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="logo">
            <img src="/images/oilsisrael-logo.png" alt="אור המדבר" style="max-width: 200px;">
          </div>
          
          <h1>${title}</h1>
          
          <div class="recipe-details">
            <p><strong>מספר יחידות:</strong> ${units}</p>
            <p><strong>גודל ליחידה:</strong> ${sizePerUnit} מ"ל</p>
            <p><strong>נפח כולל:</strong> ${totalVolume} מ"ל</p>
          </div>
          
          <div class="ingredients">
            <h2>מרכיבים:</h2>
            ${ingredients
              .filter((ing) => ing.name)
              .map(
                (ing) => `
                <div class="ingredient">
                  <strong>${ing.name}:</strong> ${calculateVolume(ing.percentage).toFixed(1)} מ"ל (${ing.percentage}%)
                </div>
              `,
              )
              .join("")}
          </div>
          
          <div class="disclaimer">
            <p>*אין לאור המדבר אחריות על המתכונים המחושבים באמצעות המחשבון ואין לראות באמור המלצה או תחליף לייעוץ רפואי</p>
          </div>
          
          <div class="footer">
            <p>נוצר בתאריך ${new Date().toLocaleDateString("he-IL")}</p>
          </div>
        </body>
      </html>
    `)

    iframe.contentDocument.close()

    // Add onload event to trigger print when content is loaded
    iframe.onload = () => {
      // Wait a moment for images to load
      setTimeout(() => {
        iframe.contentWindow.print()
        // Remove the iframe after printing
        setTimeout(() => {
          document.body.removeChild(iframe)
        }, 1000)
      }, 500)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4" dir="rtl">
      <Card className="max-w-2xl mx-auto">
        <div className="flex justify-center pt-6">
          <Image
            src="/images/oilsisrael-logo.png"
            alt="אור המדבר"
            width={200}
            height={100}
            className="object-contain"
          />
        </div>
        <CardHeader>
          <CardTitle>מחשבון המתכונים של אור המדבר</CardTitle>
          <CardDescription>חישוב כמויות מדויקות למתכונים באחוזים</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="recipe-name">שם המתכון</Label>
            <Input
              id="recipe-name"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="לדוגמה: שמן עיסוי לבנדר"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="units">מספר יחידות</Label>
              <Input
                id="units"
                type="number"
                min="1"
                value={units}
                onChange={(e) => setUnits(Math.max(1, Number.parseInt(e.target.value) || 1))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">גודל ליחידה (מ"ל)</Label>
              <Input
                id="size"
                type="number"
                min="1"
                value={sizePerUnit}
                onChange={(e) => setSizePerUnit(Math.max(1, Number.parseInt(e.target.value) || 1))}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">מרכיבים</h3>
              <div className="text-sm text-muted-foreground">
                סה"כ: {totalPercentage}%
                <span className={totalPercentage !== 100 ? "text-red-500 mr-1" : "text-green-500 mr-1"}>
                  {totalPercentage === 100 ? "✓" : "✗"}
                </span>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-end gap-2">
                  <div className="flex-grow space-y-2">
                    <Label htmlFor={`ingredient-${index}`}>שם המרכיב</Label>
                    <Input
                      id={`ingredient-${index}`}
                      value={ingredient.name}
                      onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                      placeholder="לדוגמה, שמן זית"
                    />
                  </div>
                  <div className="w-24 space-y-2">
                    <Label htmlFor={`percentage-${index}`}>אחוז</Label>
                    <div className="flex items-center">
                      <Input
                        id={`percentage-${index}`}
                        type="number"
                        min="0"
                        max="100"
                        value={ingredient.percentage}
                        onChange={(e) => handleIngredientChange(index, "percentage", e.target.value)}
                      />
                      <span className="mr-1">%</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveIngredient(index)} className="mb-0.5">
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">הסר מרכיב</span>
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={handleAddIngredient} className="w-full">
                <Plus className="h-4 w-4 ml-2" />
                הוסף מרכיב
              </Button>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">תוצאות</h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={printRecipe}
                  disabled={totalPercentage !== 100 || ingredients.length === 0}
                  className="flex items-center"
                >
                  <Printer className="h-4 w-4 ml-2" />
                  הדפס
                </Button>
                <Button
                  variant="outline"
                  onClick={downloadPDF}
                  disabled={totalPercentage !== 100 || ingredients.length === 0}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 ml-2" />
                  הורד PDF
                </Button>
              </div>
            </div>
            <div className="bg-muted p-4 rounded-md">
              <p className="font-medium mb-2">נפח כולל: {totalVolume} מ"ל</p>
              <ul className="space-y-1">
                {ingredients.map((ingredient, index) => (
                  <li key={index} className="flex justify-between">
                    <span>{ingredient.name || "מרכיב ללא שם"}:</span>
                    <span className="font-medium">{calculateVolume(ingredient.percentage).toFixed(1)} מ"ל</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground pt-2 border-t">
          <p>
            *אין לאור המדבר אחריות על המתכונים המחושבים באמצעות המחשבון ואין לראות באמור המלצה או תחליף לייעוץ רפואי
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
