"use client"
import { Tabs,TabsContent,TabsList,TabsTrigger } from "@/components/ui/tabs"
import { PropostasBoard } from "@/components/propostas-board"
import { PropostasCRM } from "@/components/propostas-crm"
import type { VertebraLead } from "@/lib/vertebra"
import type { VagasConfig } from "@/app/actions/vertebra-actions"
import type { ProposalLead } from "@/app/actions/propostas-crm-actions"
export function PropostasPage({leads,vagas,crm}:{leads:VertebraLead[];vagas:VagasConfig;crm:ProposalLead[]}){return <Tabs defaultValue="crm" className="flex flex-col gap-5"><TabsList className="w-fit"><TabsTrigger value="crm">CRM de propostas</TabsTrigger><TabsTrigger value="vertebra">Leads Vértebra</TabsTrigger></TabsList><TabsContent value="crm"><PropostasCRM initialLeads={crm}/></TabsContent><TabsContent value="vertebra"><PropostasBoard initialLeads={leads} vagas={vagas}/></TabsContent></Tabs>}
