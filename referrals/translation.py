# referrals/translation.py
from modeltranslation.translator import register, TranslationOptions
from .models import InterventionType, UrgencyLevel

@register(InterventionType)
class InterventionTypeTranslationOptions(TranslationOptions):
    fields = ('name', 'description',)

@register(UrgencyLevel)
class UrgencyLevelTranslationOptions(TranslationOptions):
    fields = ('name',)
