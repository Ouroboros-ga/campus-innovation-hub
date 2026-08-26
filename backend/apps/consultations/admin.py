from django.contrib import admin

from apps.consultations.models import Consultation, Reply


@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ["title", "author", "category", "visibility", "status", "created_at"]
    list_filter = ["category", "visibility", "status"]
    search_fields = ["title"]
    raw_id_fields = ["author", "competition"]


@admin.register(Reply)
class ReplyAdmin(admin.ModelAdmin):
    list_display = ["consultation", "author", "created_at"]
    raw_id_fields = ["consultation", "author"]
