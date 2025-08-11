# apps/pegawai/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Pegawai, UnitKerja, Bidang
from apps.spekta.models import SKP # Impor model SKP

def update_atasan_for_pegawai(pegawai_instance):
    """
    Logika utama untuk menentukan dan menyimpan atasan langsung
    dan memperbarui Pejabat Penilai pada SKP aktif.
    """
    original_atasan = pegawai_instance.atasan_langsung
    new_atasan = None

    if pegawai_instance.unit_kerja:
        kepala_unit = pegawai_instance.unit_kerja.kepala_unit
        kepala_bidang = pegawai_instance.unit_kerja.bidang.kepala_bidang

        if kepala_unit == pegawai_instance:
            new_atasan = kepala_bidang
        else:
            new_atasan = kepala_unit

    if original_atasan != new_atasan:
        # Perbarui atasan langsung di profil pegawai
        Pegawai.objects.filter(pk=pegawai_instance.pk).update(atasan_langsung=new_atasan)

        # --- LOGIKA BARU DITAMBAHKAN DI SINI ---
        # Cari SKP milik pegawai ini yang masih dalam proses (aktif)
        active_skp_statuses = ['Draft', 'Diajukan', 'Persetujuan']
        skps_to_update = SKP.objects.filter(
            pegawai=pegawai_instance, 
            status__in=active_skp_statuses
        )
        # Perbarui pejabat penilai di semua SKP aktif tersebut
        skps_to_update.update(pejabat_penilai=new_atasan)

@receiver(post_save, sender=Pegawai)
def pegawai_saved_handler(sender, instance, created, **kwargs):
    """
    Signal ini berjalan setiap kali seorang Pegawai disimpan.
    """
    update_atasan_for_pegawai(instance)


@receiver(post_save, sender=UnitKerja)
def unit_kerja_saved_handler(sender, instance, **kwargs):
    """
    Signal ini berjalan setiap kali data UnitKerja (termasuk kepala unit) diubah.
    Ini akan memperbarui atasan untuk semua anggota unit tersebut.
    """
    for pegawai in instance.anggota_list.all():
        update_atasan_for_pegawai(pegawai)

@receiver(post_save, sender=Bidang)
def bidang_saved_handler(sender, instance, **kwargs):
    """
    Signal ini berjalan setiap kali data Bidang (termasuk kepala bidang) diubah.
    Ini akan memperbarui atasan untuk semua kepala unit di bawah bidang tersebut.
    """
    for unit in instance.unit_kerja_list.all():
        if unit.kepala_unit:
            update_atasan_for_pegawai(unit.kepala_unit)