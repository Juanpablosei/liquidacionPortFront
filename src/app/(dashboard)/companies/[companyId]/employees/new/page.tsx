'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { createEmployee } from '@/lib/api/employees';
import { createEmployeeSchema, type CreateEmployeeInput } from '@/lib/validators/employee';
import { ROUTES } from '@/lib/constants/routes';
import { PageHeader } from '@/components/shared/page-header';
import { FormField } from '@/components/shared/form-field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const DOCUMENT_TYPES = [
  { value: 'DNI',      label: 'DNI' },
  { value: 'CUIL',     label: 'CUIL' },
  { value: 'CUIT',     label: 'CUIT' },
  { value: 'PASSPORT', label: 'Pasaporte' },
];

const INPUT_CLASS = 'bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 focus:border-[#2563EB]/50 focus:ring-0';

export default function NewEmployeePage() {
  const { companyId } = useParams<{ companyId: string }>();
  const router         = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(createEmployeeSchema),
    defaultValues: { documentType: 'DNI' },
  });

  async function onSubmit(data: CreateEmployeeInput) {
    setLoading(true);
    try {
      const payload = {
        documentType:   data.documentType,
        documentNumber: data.documentNumber,
        firstName:      data.firstName,
        lastName:       data.lastName,
        hireDate:       data.hireDate,
        email:          data.email    || undefined,
        phone:          data.phone    || undefined,
        birthDate:      data.birthDate || undefined,
      };
      const employee = await createEmployee(companyId, payload);
      toast.success('Empleado creado correctamente');
      router.push(ROUTES.employee(companyId, employee.id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al crear el empleado';
      if (msg.toLowerCase().includes('409') || msg.toLowerCase().includes('ya existe')) {
        toast.error('Ya existe un empleado con ese número de documento en esta empresa.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nuevo empleado"
        description="Completá los datos del empleado. Podrás agregar su contrato a continuación."
        backHref={ROUTES.employees(companyId)}
      />

      <div className="max-w-lg">
        <div className="bg-[#0F172A] border border-white/[0.06] rounded-xl p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">

            <div className="flex gap-3">
              <FormField
                label="Tipo de documento"
                name="documentType"
                error={errors.documentType?.message}
                required
                className="w-44 shrink-0"
              >
                <Select
                  defaultValue="DNI"
                  onValueChange={(v) => setValue('documentType', v, { shouldValidate: true })}
                >
                  <SelectTrigger className={INPUT_CLASS}>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F172A] border-white/[0.1] text-white">
                    {DOCUMENT_TYPES.map((dt) => (
                      <SelectItem
                        key={dt.value}
                        value={dt.value}
                        className="focus:bg-white/[0.06] focus:text-white"
                      >
                        {dt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <FormField
                label="Número de documento"
                name="documentNumber"
                error={errors.documentNumber?.message}
                required
                className="flex-1"
              >
                <Input
                  {...register('documentNumber')}
                  placeholder="Ej: 32123456"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            <div className="flex gap-3">
              <FormField label="Nombre" name="firstName" error={errors.firstName?.message} required className="flex-1">
                <Input
                  {...register('firstName')}
                  placeholder="Ej: Juan"
                  className={INPUT_CLASS}
                />
              </FormField>
              <FormField label="Apellido" name="lastName" error={errors.lastName?.message} required className="flex-1">
                <Input
                  {...register('lastName')}
                  placeholder="Ej: García"
                  className={INPUT_CLASS}
                />
              </FormField>
            </div>

            <FormField
              label="Fecha de ingreso"
              name="hireDate"
              error={errors.hireDate?.message}
              required
            >
              <Input
                {...register('hireDate')}
                type="date"
                className={`${INPUT_CLASS} [color-scheme:dark]`}
              />
            </FormField>

            <div className="border-t border-white/[0.06] pt-4 flex flex-col gap-5">
              <p className="text-xs text-slate-500 -mb-2">Datos opcionales</p>

              <FormField label="Email" name="email" error={errors.email?.message}>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="empleado@empresa.com"
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField label="Teléfono" name="phone" error={errors.phone?.message}>
                <Input
                  {...register('phone')}
                  placeholder="+54 11 1234-5678"
                  className={INPUT_CLASS}
                />
              </FormField>

              <FormField
                label="Fecha de nacimiento"
                name="birthDate"
                error={errors.birthDate?.message}
              >
                <Input
                  {...register('birthDate')}
                  type="date"
                  className={`${INPUT_CLASS} [color-scheme:dark]`}
                />
              </FormField>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 text-white py-2.5 rounded-xl text-sm font-medium transition-colors mt-1"
            >
              {loading ? 'Creando...' : 'Crear empleado'}
            </button>
          </form>
        </div>

        <p className="text-xs text-slate-600 mt-4 text-center">
          Después de crear el empleado podrás agregar su <span className="text-slate-400">contrato y horario</span>.
        </p>
      </div>
    </>
  );
}
