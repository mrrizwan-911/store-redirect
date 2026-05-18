"use client";

import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { quotationSchema, QuotationInput } from "@/lib/validations/quotation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { logger } from "@/lib/utils/logger";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCombobox } from "./ProductCombobox";
import { useRouter } from "next/navigation";
import { useAppSelector } from "@/store/hooks";

export const QuotationForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedRef, setSubmittedRef] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Record<number, any>>({});
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((s) => s.auth);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<QuotationInput>({
    resolver: zodResolver(quotationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      province: "",
      postalCode: "",
      country: "Pakistan", // Default to Pakistan as it's a local brand
      items: [{ productId: "", quantity: 10, notes: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (data: QuotationInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      // Always parse JSON — even on 4xx/5xx the API returns JSON
      let result: any = null;
      try {
        result = await response.json();
      } catch {
        throw new Error("Server returned an invalid response. Please try again.");
      }

      if (result?.success) {
        setSubmittedRef(result.data?.id?.slice(-8).toUpperCase() || "");
        setIsSuccess(true);
        toast.success("Quotation request submitted successfully!");
        reset();
      } else {
        throw new Error(result?.error || "Failed to submit request");
      }
    } catch (error: any) {
      logger.error("Quotation submission error", error);
      toast.error(error.message || "An unexpected error occurred. Please try again.");
    } finally {
      // ALWAYS clear the spinner — this was the bug: setIsSubmitting(false) was
      // only called in finally, but if the response.json() threw an uncaught
      // error the finally block was skipped in the previous version.
      setIsSubmitting(false);
    }
  };

  // ── Success Screen ────────────────────────────────────────────────────────
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500 font-body space-y-6">
        <div className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-display">Request Received!</h2>
          {submittedRef && (
            <p className="text-sm font-mono text-neutral-500 bg-neutral-50 px-4 py-2 inline-block border">
              REF: #{submittedRef}
            </p>
          )}
        </div>
        <p className="text-muted-foreground max-w-md mx-auto">
          Thank you for your interest. Our B2B team will review your request and send a formal
          quotation within 24 hours. Check your email for confirmation.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {isAuthenticated && (
            <Button
              className="rounded-none bg-black text-white hover:bg-neutral-800 h-11 px-8 font-body"
              onClick={() => router.push("/account/quotations")}
            >
              View My Quotations
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => { setIsSuccess(false); setSubmittedRef(""); }}
            className="rounded-none border-black hover:bg-black hover:text-white transition-colors font-body h-11 px-8"
          >
            Submit Another Request
          </Button>
        </div>
      </div>
    );
  }

  // ── Form ──────────────────────────────────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 font-body">
      <div className="lg:col-span-2">
        <form data-testid="quotation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Contact fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("name")}
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Work Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@company.com"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("email")}
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+92 300 1234567"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("phone")}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="Company Pvt Ltd"
                className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                {...register("company")}
              />
              {errors.company && <p className="text-sm text-red-500">{errors.company.message}</p>}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h3 className="text-xl font-display">Shipping Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine1">Address Line 1 *</Label>
                <Input
                  id="addressLine1"
                  placeholder="Street address, P.O. box, company name, c/o"
                  className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                  {...register("addressLine1")}
                />
                {errors.addressLine1 && <p className="text-sm text-red-500">{errors.addressLine1.message}</p>}
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  placeholder="Apartment, suite, unit, building, floor, etc."
                  className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                  {...register("addressLine2")}
                />
                {errors.addressLine2 && <p className="text-sm text-red-500">{errors.addressLine2.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Karachi"
                  className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                  {...register("city")}
                />
                {errors.city && <p className="text-sm text-red-500">{errors.city.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="province">Province *</Label>
                <Input
                  id="province"
                  placeholder="Sindh"
                  className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                  {...register("province")}
                />
                {errors.province && <p className="text-sm text-red-500">{errors.province.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  placeholder="75500"
                  className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                  {...register("postalCode")}
                />
                {errors.postalCode && <p className="text-sm text-red-500">{errors.postalCode.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country *</Label>
                <Input
                  id="country"
                  placeholder="Pakistan"
                  className="rounded-none border-gray-200 focus:border-black ring-0 focus-visible:ring-0 transition-all font-body"
                  {...register("country")}
                />
                {errors.country && <p className="text-sm text-red-500">{errors.country.message}</p>}
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-display">Requested Products</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ productId: "", quantity: 10, notes: "" })}
                className="rounded-none border-black hover:bg-black hover:text-white transition-all flex items-center gap-2 font-body"
              >
                <Plus className="w-4 h-4" /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="rounded-none border-gray-100 shadow-none bg-[#FAFAFA]">
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-7 space-y-2">
                        <Label>Select Product *</Label>
                        <ProductCombobox
                          value={field.productId}
                          onChange={(val, product) => {
                            setValue(`items.${index}.productId`, val);
                            setValue(`items.${index}.variantId`, ""); // reset variant
                            setSelectedProducts(prev => ({ ...prev, [index]: product }));
                          }}
                        />
                        {errors.items?.[index]?.productId && (
                          <p className="text-xs text-red-500">{errors.items[index]?.productId?.message}</p>
                        )}
                        
                        {/* Variant Selector */}
                        {selectedProducts[index]?.variants && selectedProducts[index].variants.length > 0 && (
                          <div className="mt-2 space-y-2">
                            <Label className="text-xs text-neutral-500">Select Variant</Label>
                            <select
                              className="flex h-10 w-full rounded-none border border-neutral-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...register(`items.${index}.variantId`)}
                            >
                              <option value="">Select a variant...</option>
                              {selectedProducts[index].variants.map((v: any) => (
                                <option key={v.id} value={v.id}>
                                  {v.title} {v.stock > 0 ? `(${v.stock} in stock)` : "(Out of stock)"}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-3 space-y-2">
                        <Label>Quantity (Min 10) *</Label>
                        <Input
                          type="number"
                          min={10}
                          className="rounded-none bg-white border-gray-200 font-body"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true })}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="text-xs text-red-500">{errors.items[index]?.quantity?.message}</p>
                        )}
                      </div>

                      <div className="md:col-span-2 flex items-end justify-end">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-none"
                          >
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Notes (Optional)</Label>
                      <Textarea
                        placeholder="Size requirements, color preferences, or custom branding needs..."
                        className="rounded-none bg-white border-gray-200 min-h-[80px] font-body"
                        {...register(`items.${index}.notes`)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            {errors.items?.root && (
              <p className="text-sm text-red-500">{errors.items.root.message}</p>
            )}
          </div>

          <Button
            type="submit"
            data-testid="quotation-submit-btn"
            disabled={isSubmitting}
            className="w-full h-12 rounded-none bg-black text-white hover:bg-zinc-800 transition-all font-medium text-lg font-body"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <LoaderCircle className="w-5 h-5 animate-spin" /> Processing...
              </span>
            ) : (
              "Submit Quote Request"
            )}
          </Button>
        </form>
      </div>

      {/* Sidebar */}
      <div className="space-y-8 font-body">
        <div className="p-8 border border-gray-100 bg-[#FAFAFA] space-y-6">
          <h3 className="text-2xl font-display">Why Choose B2B?</h3>
          <ul className="space-y-4">
            {[
              {
                title: "Volume Discounts",
                desc: "Significant savings for orders over 50 units per item.",
              },
              {
                title: "Priority Processing",
                desc: "Response to quotations within 24 business hours.",
              },
              {
                title: "Custom Packaging",
                desc: "Branded boxes and custom tagging available for wholesale.",
              },
              {
                title: "Flexible Logistics",
                desc: "Door-to-door delivery across Pakistan with tracking.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-black mt-2 shrink-0" />
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-8 border border-gray-100 bg-white space-y-4">
          <h4 className="font-serif text-lg">Need Help?</h4>
          <p className="text-sm text-muted-foreground">
            Have a complex request or want to talk to our corporate sales representative directly?
          </p>
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-full rounded-none border-black hover:bg-black hover:text-white transition-all font-body h-10"
            )}
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
};
