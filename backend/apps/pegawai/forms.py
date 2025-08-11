# apps/pegawai/forms.py

from django import forms
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import Pegawai, Jabatan
from django_select2.forms import Select2TagWidget

class JabatanModelChoiceField(forms.ModelChoiceField):
    def to_python(self, value):
        # --- PERBAIKAN DIMULAI DI SINI ---
        if isinstance(value, list):
            # Jika list-nya kosong (misal, saat field dikosongkan), kembalikan None.
            if not value:
                return None
            # Jika tidak, baru ambil elemen pertamanya.
            value = value[0]
        # --- AKHIR PERBAIKAN ---

        if value in self.empty_values:
            return None
        
        try:
            key = self.to_field_name or 'pk'
            obj = self.queryset.get(**{key: value})
            return obj
        except (ValueError, TypeError, self.queryset.model.DoesNotExist):
            jabatan_baru, created = Jabatan.objects.get_or_create(
                nama_jabatan__iexact=value.strip(),
                defaults={'nama_jabatan': value.strip()}
            )
            return jabatan_baru

class PegawaiCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = Pegawai
        fields = ('email', 'nip', 'nama_lengkap')

class PegawaiChangeForm(UserChangeForm):
    jabatan = JabatanModelChoiceField(
        queryset=Jabatan.objects.all(),
        required=False,
        widget=Select2TagWidget(
            attrs={
                'data-placeholder': 'Pilih atau ketik untuk menambah jabatan...',
                'data-width': '100%',
                'data-tags': 'true',
                'data-token-separators': '[","]'
            }
        )
    )

    class Meta(UserChangeForm.Meta):
        model = Pegawai
        fields = '__all__'