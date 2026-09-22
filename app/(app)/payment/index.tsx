import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../../src/auth/store'
import { usePaymentLink, useFeeDetails, useFeatures } from '../../../src/api/queries'
import { useState } from 'react'
import { NetworkStatusBanner } from '../../../src/components/NetworkStatusBanner'
import { NotificationStatusBanner } from '../../../src/components/NotificationStatusBanner'
import { AppBackground } from '../../../src/components/AppBackground'
import { FeatureDisabled } from '../../../src/components/FeatureDisabled'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'
const RED = '#C94343'

const dash = (v?: string | number | null) => (v === null || v === undefined || v === '' ? '-' : v)
const formatAmount = (v?: number | null) => (v == null ? '-' : `₹${v.toLocaleString('en-IN')}`)
const formatOutstanding = (v?: number | null) => (v == null ? '-' : v === 0 ? 'No dues' : `₹${v.toLocaleString('en-IN')}`)
const formatDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

export default function PaymentScreen() {
  const roll = useAuthStore((s) => s.activeWardRoll) ?? ''
  const { data: link, isLoading: linkLoading } = usePaymentLink()
  const { data: fee, isLoading: feeLoading } = useFeeDetails(roll)
  const { data: features } = useFeatures()
  const [expanded, setExpanded] = useState(false)

  function handlePay() {
    if (link?.url) {
      router.push('/(app)/payment/webview')
    }
  }

  const isDue = fee?.status === 'due' || fee?.status === 'overdue'

  return (
    <AppBackground style={styles.container}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <NetworkStatusBanner />
      <NotificationStatusBanner />
      {features && !features.fees ? (
        <View style={styles.feeCard}>
          <FeatureDisabled message="Fee dues are currently unavailable." />
        </View>
      ) : (
      <>
      {/* Outstanding Fee Card */}
      <View style={[styles.feeCard, { borderColor: isDue ? RED : GREEN_ACCENT }]}>
        <View style={styles.feeHeader}>
          <Text style={styles.feeTitle}>Outstanding Fee</Text>
          {fee?.status && (
            <View style={[styles.dueBadge, { backgroundColor: isDue ? '#F6E2E2' : GREEN_LIGHT }]}>
              <Text style={[styles.dueBadgeText, { color: isDue ? RED : GREEN_ACCENT }]}>
                {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.feeAmount, { color: isDue ? RED : GREEN }]}>
          {feeLoading ? '-' : formatOutstanding(fee?.outstanding_amount)}
        </Text>
        <Text style={styles.feeDate}>Last Date: {feeLoading ? '-' : formatDate(fee?.due_date)}</Text>
      </View>

      {/* Pay Button */}
      <TouchableOpacity
        style={[styles.payButton, (!link?.url || linkLoading) && styles.payButtonDisabled]}
        onPress={handlePay}
        disabled={!link?.url || linkLoading}
        activeOpacity={0.8}
      >
        <Ionicons name="open-outline" size={20} color="#fff" style={{ marginRight: 10 }} />
        <Text style={styles.payButtonText}>Pay on College Website</Text>
      </TouchableOpacity>

      {/* Info Text */}
      <Text style={styles.infoText}>
        You will be redirected to the official college ERP website for fee payment.
      </Text>

      {/* Fee Details */}
      <TouchableOpacity
        style={[styles.detailsToggle, expanded && styles.detailsToggleExpanded]}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.detailsTitle}>Fee Details</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={20} color={GREEN} />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.detailsCard}>
          {fee?.breakdown && fee.breakdown.length > 0 ? (
            fee.breakdown.map((item, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailLabel}>{dash(item.label)}</Text>
                <Text style={styles.detailAmount}>{formatAmount(item.amount)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyDetails}>No fee breakdown available.</Text>
          )}
          <View style={[styles.detailRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatAmount(fee?.outstanding_amount)}</Text>
          </View>
        </View>
      )}
      </>
      )}
      </ScrollView>
    </AppBackground>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  feeCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20, marginBottom: 20,
    borderWidth: 1.5,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  feeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  feeTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  dueBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  dueBadgeText: { fontSize: 12, fontWeight: '700' },
  feeAmount: { fontSize: 32, fontWeight: '700', marginBottom: 4 },
  feeDate: { fontSize: 13, color: '#000' },

  payButton: {
    flexDirection: 'row', backgroundColor: GREEN_ACCENT, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    elevation: 2, shadowColor: GREEN, shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 3 },
  },
  payButtonDisabled: { opacity: 0.5 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  infoText: { fontSize: 13, color: '#000', textAlign: 'center', lineHeight: 19, marginBottom: 24 },

  detailsToggle: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  detailsTitle: { fontSize: 15, fontWeight: '600', color: GREEN },
  detailsToggleExpanded: {},

  detailsCard: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingHorizontal: 16, paddingTop: 4, paddingBottom: 16,
    marginTop: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 },
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F5F5F5', gap: 12,
  },
  detailLabel: { flex: 1, fontSize: 13, color: '#000' },
  detailAmount: { fontSize: 14, color: '#333', fontWeight: '500' },
  totalRow: { borderBottomWidth: 0, marginTop: 4 },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#1a1a1a' },
  totalAmount: { fontSize: 15, fontWeight: '700', color: RED },
  emptyDetails: { fontSize: 13, color: '#000', textAlign: 'center', paddingVertical: 12 },
})
