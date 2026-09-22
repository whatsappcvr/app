import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import {
  MOCK_WARDS,
  MOCK_PROFILE,
  MOCK_DAILY_ATTENDANCE,
  generateMockDailyRange,
  MOCK_WEEKLY_ATTENDANCE,
  MOCK_MONTHLY_ATTENDANCE,
  MOCK_SEMESTER_ATTENDANCE,
  MOCK_ATTENDANCE_OVERVIEW,
  MOCK_MID_RESULTS,
  MOCK_ASSIGNMENT_RESULTS,
  MOCK_SEMESTER_RESULTS,
  MOCK_MENTOR,
  MOCK_PAYMENT_LINK,
  MOCK_FEE_DETAILS,
  MOCK_CIRCULARS,
} from './mock-data'

type Route = {
  match: RegExp
  handler: (url: string, params: URLSearchParams) => unknown
}

const routes: Route[] = [
  {
    match: /\/auth\/otp\/request$/,
    handler: () => ({ message: 'OTP sent via SMS', expires_in: 300 }),
  },
  {
    match: /\/auth\/otp\/verify$/,
    handler: () => ({
      token: 'mock-jwt-token-' + Date.now(),
      wards: MOCK_WARDS,
    }),
  },
  {
    match: /\/me\/students$/,
    handler: () => MOCK_WARDS,
  },
  {
    match: /\/students\/[^/]+$/,
    handler: () => MOCK_PROFILE,
  },
  {
    match: /\/students\/[^/]+\/fees$/,
    handler: () => MOCK_FEE_DETAILS,
  },
  {
    match: /\/students\/[^/]+\/attendance\/overview$/,
    handler: () => MOCK_ATTENDANCE_OVERVIEW,
  },
  {
    match: /\/students\/[^/]+\/attendance/,
    handler: (_url, params) => {
      const range = params.get('range')
      switch (range) {
        case 'daily': {
          const from = params.get('from')
          const to = params.get('to')
          if (from && to && from !== to) return generateMockDailyRange(from, to)
          return MOCK_DAILY_ATTENDANCE
        }
        case 'weekly': return MOCK_WEEKLY_ATTENDANCE
        case 'monthly': return MOCK_MONTHLY_ATTENDANCE
        case 'semester': return MOCK_SEMESTER_ATTENDANCE
        default: return MOCK_SEMESTER_ATTENDANCE
      }
    },
  },
  {
    match: /\/students\/[^/]+\/results\/mid$/,
    handler: () => MOCK_MID_RESULTS,
  },
  {
    match: /\/students\/[^/]+\/results\/assignments$/,
    handler: () => MOCK_ASSIGNMENT_RESULTS,
  },
  {
    match: /\/students\/[^/]+\/results\/semester$/,
    handler: () => MOCK_SEMESTER_RESULTS,
  },
  {
    match: /\/students\/[^/]+\/mentor$/,
    handler: () => MOCK_MENTOR,
  },
  {
    match: /\/payment\/link$/,
    handler: () => MOCK_PAYMENT_LINK,
  },
  {
    match: /\/circulars/,
    handler: () => MOCK_CIRCULARS,
  },
  {
    match: /\/device-tokens$/,
    handler: () => ({ ok: true }),
  },
]

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function enableMockApi(client: AxiosInstance) {
  client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? ''
    const params = new URLSearchParams(url.split('?')[1] ?? '')
    const path = url.split('?')[0]

    for (const route of routes) {
      if (route.match.test(path)) {
        await delay(300 + Math.random() * 400)
        const data = route.handler(url, params)

        config.adapter = async () => ({
          data,
          status: 200,
          statusText: 'OK',
          headers: { 'content-type': 'application/json' },
          config,
        })
        return config
      }
    }

    return config
  })
}
