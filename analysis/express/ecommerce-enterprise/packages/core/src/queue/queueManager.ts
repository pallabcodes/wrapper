/**
 * Queue Manager
 */

import Bull from 'bull'
import { env } from '../config/env'

export const queueManager = {
  createQueue: (name: string): Bull.Queue => {
    return new Bull(name, {
      redis: env.REDIS_URL
    })
  }
}
