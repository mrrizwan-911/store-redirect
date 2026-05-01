'use client'

import { format } from 'date-fns'
import { MoreHorizontal, Trash2, MailX, UserCheck } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Subscriber {
  id: string
  email: string
  status: 'ACTIVE' | 'UNSUBSCRIBED'
  source: string | null
  createdAt: Date
}

interface SubscriberTableProps {
  subscribers: Subscriber[]
}

export function SubscriberTable({ subscribers }: SubscriberTableProps) {
  if (subscribers.length === 0) {
    return (
      <div className="bg-white border border-neutral-100 p-12 text-center">
        <p className="text-neutral-400 text-xs font-bold uppercase tracking-widest">
          No subscribers found.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white border border-neutral-100 overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-50/50">
          <TableRow className="hover:bg-transparent border-neutral-100">
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 py-4 h-auto">Email Address</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 py-4 h-auto">Status</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 py-4 h-auto">Source</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 py-4 h-auto">Joined Date</TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 py-4 h-auto text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.map((subscriber) => (
            <TableRow key={subscriber.id} className="hover:bg-neutral-50/30 border-neutral-100 group">
              <TableCell className="font-medium text-[13px] text-neutral-900 py-4">{subscriber.email}</TableCell>
              <TableCell className="py-4">
                <Badge
                  variant="outline"
                  className={cn(
                    "rounded-none px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border-0",
                    subscriber.status === 'ACTIVE'
                      ? "bg-green-50 text-green-700"
                      : "bg-neutral-100 text-neutral-500"
                  )}
                >
                  {subscriber.status}
                </Badge>
              </TableCell>
              <TableCell className="text-[11px] text-neutral-500 uppercase tracking-tight py-4">
                {subscriber.source || 'Unknown'}
              </TableCell>
              <TableCell className="text-[11px] text-neutral-400 font-mono py-4">
                {format(new Date(subscriber.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell className="text-right py-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-none border-neutral-200">
                    {subscriber.status === 'ACTIVE' ? (
                      <DropdownMenuItem className="text-xs uppercase tracking-wider gap-2 text-neutral-600">
                        <MailX className="h-3.5 w-3.5" /> Unsubscribe
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem className="text-xs uppercase tracking-wider gap-2 text-neutral-600">
                        <UserCheck className="h-3.5 w-3.5" /> Re-activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem className="text-xs uppercase tracking-wider gap-2 text-red-600 focus:text-red-600">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
