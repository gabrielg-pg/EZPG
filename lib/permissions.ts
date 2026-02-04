export function isAdmin(roles: string | string[]) {
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return rolesArray.includes("admin")
}

export function isComercial(roles: string | string[]) {
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return rolesArray.includes("comercial")
}

export function isZonaExecucao(roles: string | string[]) {
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return rolesArray.includes("zona_execucao")
}

export function hasRole(roles: string | string[], role: string) {
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return rolesArray.includes(role)
}

export function hasAnyRole(roles: string | string[], checkRoles: string[]) {
  const rolesArray = Array.isArray(roles) ? roles : [roles]
  return checkRoles.some(role => rolesArray.includes(role))
}
