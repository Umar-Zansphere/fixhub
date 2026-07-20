'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, ShieldCheck, Star } from 'lucide-react';
import { toast } from 'sonner';

import { useTechnician, useVerifyTechnician, useUpdateTechnicianStatus } from '@/lib/api/queries/use-technicians';
import { formatDate, formatDateTime, verificationStatusVariant } from '@/lib/utils';
import type { VerificationStatus } from '@/lib/types';
import { Avatar, Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton, Tabs } from '@/components/ui';

export default function TechnicianProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = React.use(params);
  const { data: tech, isLoading } = useTechnician(resolvedParams.id);
  const verifyMutation = useVerifyTechnician();
  const statusMutation = useUpdateTechnicianStatus();
  const [tab, setTab] = React.useState('overview');

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!tech) return <div className="text-sm text-[#9CA3AF]">Technician not found.</div>;

  const name = tech.user?.name ?? 'Unknown';
  const vs = tech.verificationStatus as VerificationStatus;

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/technicians">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex flex-1 items-center gap-4">
          <Avatar name={name} src={tech.profilePictureUrl} size="lg" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-[#111827]">{name}</h1>
              <Badge variant={verificationStatusVariant(vs)}>{vs.replace('_', ' ')}</Badge>
              <Badge variant={tech.user?.isActive ? 'success' : 'danger'}>
                {tech.user?.isActive ? 'Active' : 'Suspended'}
              </Badge>
            </div>
            <p className="text-sm text-[#6B7280]">
              {tech.user?.phone} · Joined {formatDate(tech.createdAt)}
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {(vs === 'PENDING' || vs === 'UNDER_REVIEW') && (
              <Button
                variant="primary"
                size="sm"
                loading={verifyMutation.isPending}
                onClick={() =>
                  verifyMutation.mutate(
                    { id: tech.id, status: 'VERIFIED' },
                    { onSuccess: () => toast.success('Technician verified') },
                  )
                }
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Verify
              </Button>
            )}
            {vs === 'PENDING' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() =>
                  verifyMutation.mutate(
                    { id: tech.id, status: 'REJECTED', rejectionNote: 'Documents incomplete' },
                    { onSuccess: () => toast.error('Technician rejected') },
                  )
                }
              >
                Reject
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                statusMutation.mutate(
                  { userId: tech.userId, isActive: !tech.user?.isActive },
                  { onSuccess: () => toast.success(tech.user?.isActive ? 'Account suspended' : 'Account activated') },
                )
              }
            >
              {tech.user?.isActive ? 'Suspend' : 'Activate'}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'documents', label: 'Documents', count: tech.documents?.length },
          { id: 'specializations', label: 'Services', count: tech.specializations?.length },
          { id: 'areas', label: 'Areas', count: tech.serviceAreas?.length },
        ]}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'overview' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Personal Details */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Personal Details</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', value: name },
                  { label: 'Phone', value: tech.user?.phone ?? '—' },
                  { label: 'Email', value: tech.user?.email ?? '—' },
                  { label: 'Verification', value: vs.replace('_', ' ') },
                  { label: 'Total Jobs', value: String(tech.totalJobs) },
                  { label: 'Rating', value: `★ ${Number(tech.rating).toFixed(1)}` },
                  { label: 'Availability', value: tech.isAvailable ? 'Available' : 'Offline' },
                  { label: 'Last Active', value: tech.lastLocationAt ? formatDateTime(tech.lastLocationAt) : 'Never' },
                  { label: 'Account Status', value: tech.user?.isActive ? 'Active' : 'Suspended' },
                  { label: 'Joined', value: formatDate(tech.createdAt) },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-[11px] text-[#9CA3AF] uppercase tracking-wide">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-[#111827]">{value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-5">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#111827]">{tech.totalJobs}</div>
                  <div className="mt-1 text-xs text-[#9CA3AF]">Total Jobs Completed</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 fill-[#F59E0B] text-[#F59E0B]" />
                    <span className="text-3xl font-bold text-[#111827]">{Number(tech.rating).toFixed(1)}</span>
                  </div>
                  <div className="mt-1 text-xs text-[#9CA3AF]">Average Rating · {tech._count?.reviews ?? 0} reviews</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent>
            {tech.documents && tech.documents.length > 0 ? (
              <div className="divide-y divide-[#F3F4F6]">
                {tech.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{doc.documentType.replace('_', ' ')}</p>
                      <p className="text-xs text-[#9CA3AF]">
                        Uploaded {formatDate(doc.createdAt)}
                        {doc.verifiedAt && ` · Verified ${formatDate(doc.verifiedAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={doc.isVerified ? 'success' : 'warning'}>
                        {doc.isVerified ? 'Verified' : 'Pending'}
                      </Badge>
                      <a href={doc.url} target="_blank" rel="noreferrer">
                        <Button variant="secondary" size="sm">View</Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF]">No documents uploaded yet.</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'specializations' && (
        <Card>
          <CardHeader><CardTitle>Service Specializations</CardTitle></CardHeader>
          <CardContent>
            {tech.specializations && tech.specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {tech.specializations.map((spec) => (
                  <div key={spec.subService.id} className="rounded-lg border border-[#E5E7EB] px-3 py-2">
                    <p className="text-sm font-medium text-[#111827]">{spec.subService.name}</p>
                    <p className="text-xs text-[#9CA3AF]">{spec.subService.category?.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF]">No specializations configured.</p>
            )}
          </CardContent>
        </Card>
      )}

      {tab === 'areas' && (
        <Card>
          <CardHeader><CardTitle>Service Areas</CardTitle></CardHeader>
          <CardContent>
            {tech.serviceAreas && tech.serviceAreas.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {tech.serviceAreas.map(({ serviceArea: area }) => (
                  <div key={area.id} className="flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-3 py-2.5">
                    <MapPin className="h-4 w-4 text-[#9CA3AF]" />
                    <div>
                      <p className="text-sm font-medium text-[#111827]">{area.name}</p>
                      <p className="text-xs text-[#9CA3AF]">{area.pincode}</p>
                    </div>
                    <Badge variant={area.isActive ? 'success' : 'neutral'} className="ml-auto text-[10px]">
                      {area.isActive ? 'Active' : 'Off'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#9CA3AF]">No service areas assigned.</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
