/**
 * SPHERE Pattern Wrapper for Booking System
 * Implements MARVA's 0.580 fractal dimension methodology
 *
 * S - SCAN + HYPOTHESIZE: Analyze situation, form hypotheses
 * P - PLAN + TEST: Design experiments, test strategies
 * H - HEAL: Execute fixes with self-healing architecture
 * E - EXAMINE + VALIDATE: Analyze results, verify success
 * R - REINFORCE: Prevent recurrence, strengthen guardrails
 * E - EVOLVE: System improvement, learn from patterns
 */

export interface SphereContext {
  operation: string
  node: string
  startTime: Date
  metadata?: Record<string, any>
}

export interface SphereResult<T> {
  success: boolean
  data?: T
  errors?: string[]
  warnings?: string[]
  healingActions?: string[]
  reinforcements?: string[]
  evolutions?: string[]
  spherePhases: {
    scan: { duration: number; findings: string[] }
    plan: { duration: number; strategy: string }
    heal: { duration: number; attempts: number; recovered: boolean }
    examine: { duration: number; validations: string[] }
    reinforce: { duration: number; guardrails: string[] }
    evolve: { duration: number; learnings: string[] }
  }
}

/**
 * SPHERE Pattern Wrapper
 * Wraps any operation with complete SPHERE methodology tracking
 */
export async function withSphere<T>(
  context: SphereContext,
  operation: () => Promise<T>,
  options?: {
    scan?: () => Promise<string[]>
    plan?: () => Promise<string>
    validate?: (result: T) => Promise<string[]>
    reinforce?: (result: T) => Promise<string[]>
    evolve?: (result: T) => Promise<string[]>
    maxRetries?: number
  }
): Promise<SphereResult<T>> {
  const result: SphereResult<T> = {
    success: false,
    spherePhases: {
      scan: { duration: 0, findings: [] },
      plan: { duration: 0, strategy: '' },
      heal: { duration: 0, attempts: 0, recovered: false },
      examine: { duration: 0, validations: [] },
      reinforce: { duration: 0, guardrails: [] },
      evolve: { duration: 0, learnings: [] }
    }
  }

  const maxRetries = options?.maxRetries ?? 3
  const errors: string[] = []
  const warnings: string[] = []

  try {
    // PHASE 1: SCAN + HYPOTHESIZE
    const scanStart = Date.now()
    console.log(`[SPHERE:SCAN] ${context.node} - ${context.operation}`)

    if (options?.scan) {
      result.spherePhases.scan.findings = await options.scan()
      console.log(`[SPHERE:SCAN] Findings:`, result.spherePhases.scan.findings)
    }

    result.spherePhases.scan.duration = Date.now() - scanStart

    // PHASE 2: PLAN + TEST
    const planStart = Date.now()
    console.log(`[SPHERE:PLAN] ${context.node} - ${context.operation}`)

    if (options?.plan) {
      result.spherePhases.plan.strategy = await options.plan()
      console.log(`[SPHERE:PLAN] Strategy:`, result.spherePhases.plan.strategy)
    }

    result.spherePhases.plan.duration = Date.now() - planStart

    // PHASE 3: HEAL (with self-healing retry)
    const healStart = Date.now()
    console.log(`[SPHERE:HEAL] ${context.node} - ${context.operation}`)

    let lastError: Error | undefined
    let operationResult: T | undefined

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      result.spherePhases.heal.attempts = attempt

      try {
        console.log(`[SPHERE:HEAL] Attempt ${attempt}/${maxRetries}`)
        operationResult = await operation()
        result.spherePhases.heal.recovered = attempt > 1

        if (result.spherePhases.heal.recovered) {
          warnings.push(`Operation succeeded after ${attempt} attempts`)
        }

        break // Success!

      } catch (error) {
        lastError = error as Error
        console.error(`[SPHERE:HEAL] Attempt ${attempt} failed:`, error)

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000 // Exponential backoff
          console.log(`[SPHERE:HEAL] Retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    if (!operationResult) {
      throw lastError || new Error('Operation failed after all retries')
    }

    result.spherePhases.heal.duration = Date.now() - healStart
    result.data = operationResult

    // PHASE 4: EXAMINE + VALIDATE
    const examineStart = Date.now()
    console.log(`[SPHERE:EXAMINE] ${context.node} - ${context.operation}`)

    if (options?.validate) {
      result.spherePhases.examine.validations = await options.validate(operationResult)
      console.log(`[SPHERE:EXAMINE] Validations:`, result.spherePhases.examine.validations)

      // Check for validation failures
      const failures = result.spherePhases.examine.validations.filter(v => v.startsWith('FAIL:'))
      if (failures.length > 0) {
        warnings.push(...failures)
      }
    }

    result.spherePhases.examine.duration = Date.now() - examineStart

    // PHASE 5: REINFORCE
    const reinforceStart = Date.now()
    console.log(`[SPHERE:REINFORCE] ${context.node} - ${context.operation}`)

    if (options?.reinforce) {
      result.spherePhases.reinforce.guardrails = await options.reinforce(operationResult)
      console.log(`[SPHERE:REINFORCE] Guardrails:`, result.spherePhases.reinforce.guardrails)
    }

    result.spherePhases.reinforce.duration = Date.now() - reinforceStart

    // PHASE 6: EVOLVE
    const evolveStart = Date.now()
    console.log(`[SPHERE:EVOLVE] ${context.node} - ${context.operation}`)

    if (options?.evolve) {
      result.spherePhases.evolve.learnings = await options.evolve(operationResult)
      console.log(`[SPHERE:EVOLVE] Learnings:`, result.spherePhases.evolve.learnings)
    }

    result.spherePhases.evolve.duration = Date.now() - evolveStart

    // Mark success
    result.success = true
    result.warnings = warnings.length > 0 ? warnings : undefined

    const totalDuration = Date.now() - context.startTime.getTime()
    console.log(`[SPHERE:COMPLETE] ${context.node} - ${context.operation} (${totalDuration}ms)`)

  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error))
    result.errors = errors
    result.success = false

    console.error(`[SPHERE:FAILED] ${context.node} - ${context.operation}`, error)
  }

  return result
}

/**
 * Simplified SPHERE wrapper for quick operations
 */
export async function withSimpleSphere<T>(
  node: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const result = await withSphere<T>(
    { operation, node, startTime: new Date() },
    fn
  )

  if (!result.success) {
    throw new Error(result.errors?.join('; ') || 'Operation failed')
  }

  return result.data!
}

/**
 * SPHERE Phase Logger for development
 */
export class SphereLogger {
  private context: SphereContext
  private phase: string = ''

  constructor(context: SphereContext) {
    this.context = context
  }

  scan(findings: string[]) {
    this.phase = 'SCAN'
    console.log(`[SPHERE:SCAN] ${this.context.node} - ${this.context.operation}`, findings)
    return this
  }

  plan(strategy: string) {
    this.phase = 'PLAN'
    console.log(`[SPHERE:PLAN] ${this.context.node} - ${this.context.operation}`, strategy)
    return this
  }

  heal(action: string) {
    this.phase = 'HEAL'
    console.log(`[SPHERE:HEAL] ${this.context.node} - ${this.context.operation}`, action)
    return this
  }

  examine(validations: string[]) {
    this.phase = 'EXAMINE'
    console.log(`[SPHERE:EXAMINE] ${this.context.node} - ${this.context.operation}`, validations)
    return this
  }

  reinforce(guardrails: string[]) {
    this.phase = 'REINFORCE'
    console.log(`[SPHERE:REINFORCE] ${this.context.node} - ${this.context.operation}`, guardrails)
    return this
  }

  evolve(learnings: string[]) {
    this.phase = 'EVOLVE'
    console.log(`[SPHERE:EVOLVE] ${this.context.node} - ${this.context.operation}`, learnings)
    return this
  }

  complete() {
    const duration = Date.now() - this.context.startTime.getTime()
    console.log(`[SPHERE:COMPLETE] ${this.context.node} - ${this.context.operation} (${duration}ms)`)
  }
}
