import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useState } from 'react'
import { Ionicons } from '@expo/vector-icons'
import { AppBackground } from '../../src/components/AppBackground'

const GREEN = '#05245F'
const GREEN_LIGHT = '#DCE8FA'
const GREEN_ACCENT = '#073B8F'

const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'hi', label: 'Hindi', native: 'హిన్దీ' },
] as const

type LangCode = (typeof LANGUAGES)[number]['code']

export default function LanguageScreen() {
  const [selected, setSelected] = useState<LangCode>('en')

  return (
    <AppBackground style={s.container}>
      <View style={s.list}>
        {LANGUAGES.map((lang) => {
          const active = selected === lang.code
          return (
            <TouchableOpacity
              key={lang.code}
              style={[s.row, active && s.rowActive]}
              activeOpacity={0.7}
              onPress={() => setSelected(lang.code)}
            >
              <View style={s.labelWrap}>
                <Text style={[s.native, active && s.nativeActive]}>{lang.native}</Text>
                {lang.code !== 'en' && (
                  <Text style={s.subtitle}>{lang.label}</Text>
                )}
              </View>
              {active && (
                <Ionicons name="checkmark" size={24} color={GREEN} />
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={s.hintWrap}>
        <Ionicons name="information-circle-outline" size={18} color="#999" style={{ marginRight: 6 }} />
        <Text style={s.hint}>You can change the app language anytime from here.</Text>
      </View>
    </AppBackground>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 16,
  },
  list: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowActive: {
    backgroundColor: GREEN_LIGHT,
  },
  labelWrap: {
    flex: 1,
  },
  native: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  nativeActive: {
    color: GREEN_ACCENT,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: '#000',
    marginTop: 2,
  },
  hintWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 24,
  },
  hint: {
    fontSize: 13,
    color: '#000',
    flex: 1,
  },
})
