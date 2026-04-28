"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  const [storeInfo, setStoreInfo] = useState({
    name: "Calnza Luxury Store",
    email: "admin@calnza.com",
    whatsapp: "+92 300 1234567"
  })

  const [notifications, setNotifications] = useState({
    orderConfirmation: true,
    abandonedCart: true,
    shipped: false
  })

  const handleSaveStoreInfo = () => {
    // Stubbed action
    toast.success("Settings updated (stubbed)")
  }

  const handleSaveToggles = () => {
    // Stubbed action
    toast.success("Settings updated (stubbed)")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
        <h1 data-testid="page-heading" className="text-2xl font-bold tracking-tight text-neutral-900">
          Admin Settings
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-4xl">
        {/* Store Information Section */}
        <Card className="rounded-xl border-neutral-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-neutral-800 uppercase">Store Info</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Manage your store&apos;s public identity and contact details.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-4">
            <div className="space-y-1">
              <Label htmlFor="store-name" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Store Name
              </Label>
              <Input
                id="store-name"
                value={storeInfo.name}
                onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })}
                className="rounded-lg border-neutral-100 bg-neutral-50/50 text-xs focus-visible:ring-neutral-200"
                placeholder="Enter store name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="store-email" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                Store Email
              </Label>
              <Input
                id="store-email"
                type="email"
                value={storeInfo.email}
                onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
                className="rounded-lg border-neutral-100 bg-neutral-50/50 text-xs focus-visible:ring-neutral-200"
                placeholder="Enter store email"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="whatsapp" className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
                WhatsApp Number
              </Label>
              <Input
                id="whatsapp"
                value={storeInfo.whatsapp}
                onChange={(e) => setStoreInfo({ ...storeInfo, whatsapp: e.target.value })}
                className="rounded-lg border-neutral-100 bg-neutral-50/50 text-xs focus-visible:ring-neutral-200"
                placeholder="+92 XXX XXXXXXX"
              />
            </div>
            <Button
              onClick={handleSaveStoreInfo}
              className="w-fit rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-widest px-6 py-2 h-auto"
            >
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings Section */}
        <Card className="rounded-xl border-neutral-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-semibold tracking-tight text-neutral-800 uppercase">Notification Toggles</CardTitle>
            <CardDescription className="text-xs text-neutral-500">
              Configure which automated emails are sent to your customers.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <Label className="font-semibold text-xs text-neutral-800">Send order confirmation emails</Label>
                <p className="text-[10px] text-neutral-400">
                  Automatically send an email to the customer after they place an order.
                </p>
              </div>
              <Switch
                checked={notifications.orderConfirmation}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, orderConfirmation: checked })
                }
                className="scale-90"
              />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <Label className="font-semibold text-xs text-neutral-800">Send abandoned cart emails</Label>
                <p className="text-[10px] text-neutral-400">
                  Automatically send a reminder to customers who leave items in their cart.
                </p>
              </div>
              <Switch
                checked={notifications.abandonedCart}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, abandonedCart: checked })
                }
                className="scale-90"
              />
            </div>
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-0.5">
                <Label className="font-semibold text-xs text-neutral-800">Send shipped emails</Label>
                <p className="text-[10px] text-neutral-400">
                  Automatically notify customers when their order has been marked as shipped.
                </p>
              </div>
              <Switch
                checked={notifications.shipped}
                onCheckedChange={(checked) =>
                  setNotifications({ ...notifications, shipped: checked })
                }
                className="scale-90"
              />
            </div>
            <Button
              onClick={handleSaveToggles}
              className="w-fit rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 text-[10px] font-bold uppercase tracking-widest px-6 py-2 h-auto"
            >
              Save Toggles
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
