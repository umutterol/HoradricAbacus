// src/constants.ts

export type BossId =
    | 'belial' | 'harbinger' | 'andariel' | 'duriel'
    | 'urivar' | 'zir' | 'beast' | 'grigoire' | 'varshan';

export type MaterialKey =
    | 'mat_husk' | 'mat_abhorrent' | 'mat_doll' | 'mat_shard'
    | 'mat_mask' | 'mat_blood' | 'mat_fear' | 'mat_steel' | 'mat_heart';

export interface BossData {
    id: BossId;
    nameKey: string;     // Key for translation
    materialKey: MaterialKey; // Key for translation
    cost: number;
    isJokerCompatible: boolean; // Can use Stygian Stone?
}

export const BOSS_LIST: BossData[] = [
    {
        id: 'belial',
        nameKey: 'boss_belial',
        materialKey: 'mat_husk',
        cost: 2,
        isJokerCompatible: false
    },
    {
        id: 'harbinger',
        nameKey: 'boss_harbinger',
        materialKey: 'mat_abhorrent',
        cost: 3,
        isJokerCompatible: true
    },
    {
        id: 'andariel',
        nameKey: 'boss_andariel',
        materialKey: 'mat_doll',
        cost: 3,
        isJokerCompatible: true
    },
    {
        id: 'duriel',
        nameKey: 'boss_duriel',
        materialKey: 'mat_shard',
        cost: 3,
        isJokerCompatible: true
    },
    {
        id: 'urivar',
        nameKey: 'boss_urivar',
        materialKey: 'mat_mask',
        cost: 12,
        isJokerCompatible: false
    },
    {
        id: 'zir',
        nameKey: 'boss_zir',
        materialKey: 'mat_blood',
        cost: 12,
        isJokerCompatible: false
    },
    {
        id: 'beast',
        nameKey: 'boss_beast',
        materialKey: 'mat_fear',
        cost: 12,
        isJokerCompatible: false
    },
    {
        id: 'grigoire',
        nameKey: 'boss_grigoire',
        materialKey: 'mat_steel',
        cost: 12,
        isJokerCompatible: false
    },
    {
        id: 'varshan',
        nameKey: 'boss_varshan',
        materialKey: 'mat_heart',
        cost: 12,
        isJokerCompatible: false
    },
];

// Joker bosses for priority selection
export const JOKER_BOSSES = BOSS_LIST.filter(b => b.isJokerCompatible);

export type JokerPriority = 'duriel' | 'andariel' | 'harbinger' | 'balanced';

export const JOKER_PRIORITY_OPTIONS: { value: JokerPriority; labelKey: string }[] = [
    { value: 'duriel', labelKey: 'priority_duriel' },
    { value: 'andariel', labelKey: 'priority_andariel' },
    { value: 'harbinger', labelKey: 'priority_harbinger' },
    { value: 'balanced', labelKey: 'priority_balanced' },
];

export type Language = 'en' | 'tr';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
    en: {
        lbl_player: "Player",
        lbl_stygian: "Stygian Stone",
        lbl_priority: "Stygian Priority",
        btn_calculate: "Optimize Loot",
        btn_reset: "Reset",
        sec_results: "Optimization Results",
        sec_trades: "Required Trades",
        txt_total_kills: "Total Summons",
        txt_no_trades: "No trades required. Everyone has optimal materials.",
        txt_gives: "gives",
        txt_to: "to",
        txt_stygian_usage: "Use Stygian Stones for",
        // Priority options
        priority_duriel: "Duriel",
        priority_andariel: "Andariel",
        priority_harbinger: "Harbinger",
        priority_balanced: "Balanced",
        // Bosses
        boss_belial: "Belial",
        boss_harbinger: "Harbinger",
        boss_andariel: "Andariel",
        boss_duriel: "Duriel",
        boss_urivar: "Urivar",
        boss_zir: "Lord Zir",
        boss_beast: "Beast in Ice",
        boss_grigoire: "Grigoire",
        boss_varshan: "Varshan",
        // Materials
        mat_husk: "Betrayer's Husk",
        mat_abhorrent: "Abhorrent Heart",
        mat_doll: "Pincushioned Doll",
        mat_shard: "Shard of Agony",
        mat_mask: "Judicator's Mask",
        mat_blood: "Exquisite Blood",
        mat_fear: "Distilled Fear",
        mat_steel: "Living Steel",
        mat_heart: "Malignant Heart",
        mat_stygian: "Stygian Stone",
        // Tutorial
        tut_welcome: "Optimize your Diablo 4 boss rotations and calculate the perfect material trades for your party.",
        tut_how_to: "How to Use",
        tut_step1: "Enter materials for all party members",
        tut_step2: "Check the boxes next to active players (auto-detects empty inventories)",
        tut_step3: "Select your preferred Stygian boss (Duriel/Andariel/Harbinger)",
        tut_step4: "Click 'Optimize Loot' to calculate max kills and trades",
        // Dialog & Feedback
        dlg_reset_title: "Reset All Data?",
        dlg_reset_message: "This will clear all material inputs and player names. This action cannot be undone.",
        dlg_confirm: "Yes, Reset",
        dlg_cancel: "Cancel",
        btn_help: "Help",
        dlg_got_it: "Got it!",
        toast_optimized: "Optimization complete!",
        txt_no_materials: "Enter materials for at least one player to optimize.",
        sec_verification: "Verify Distribution",
        txt_after_trades: "After trades, each player should have:",
        aria_player_toggle: "Toggle player {0} active status",
        aria_material_input: "{0} count for Player {1}",
        aria_player_name: "Player {0} name",
        // Share feature
        btn_share: "Share",
        toast_link_copied: "Link copied to clipboard!",
        toast_link_error: "Failed to copy link",
        toast_state_loaded: "Party data loaded from link!",
        // OCR feature
        btn_screenshot: "Import",
        ocr_title: "Import from Screenshot",
        ocr_drop_hint: "Drop screenshot here or click to upload",
        ocr_paste_hint: "You can also paste from clipboard (Ctrl+V / Cmd+V)",
        ocr_processing: "Analyzing screenshot...",
        ocr_error_no_materials: "No materials found in image",
        ocr_error_processing: "Failed to process image",
        ocr_confirm: "Apply",
        ocr_cancel: "Cancel",
        ocr_detected: "Detected Materials",
        ocr_confidence: "Confidence",
        ocr_edit_hint: "Edit values before applying",
        // Session/Party feature
        btn_create_session: "Create Party",
        btn_join_session: "Join Party",
        btn_leave: "Leave",
        btn_ready: "Ready",
        btn_unready: "Not Ready",
        btn_copy_code: "Copy Code",
        btn_copy_link: "Copy Link",
        btn_join: "Join",
        btn_start_session: "Start Session",
        lbl_session: "Party",
        txt_you: "You",
        txt_ready: "ready",
        txt_reconnecting: "Reconnecting...",
        txt_session_created: "Party created successfully!",
        txt_share_code: "Share this code with your party members",
        txt_create_session_info: "Create a new party session and invite up to 3 other players to join.",
        dlg_create_session_title: "Create a Party",
        dlg_join_session_title: "Join a Party",
        placeholder_session_code: "Enter 6-digit code",
        err_create_session: "Failed to create party. Please try again.",
        err_join_session: "Could not join party. Check the code and try again.",
        err_session_full: "Party is full",
        err_session_not_found: "Party not found or expired",
        txt_manual_entry: "Manual",
        toast_session_full: "This party is full (4/4 players)",
        toast_code_copied: "Code copied!",
        placeholder_player_name: "Your name (optional)",
        txt_waiting_ready: "Waiting for all players to ready up",
        txt_all_ready_required: "All online players must be ready to optimize",
    },
    tr: {
        lbl_player: "Oyuncu",
        lbl_stygian: "Stygian Stone",
        lbl_priority: "Stygian Önceliği",
        btn_calculate: "Optimize Et",
        btn_reset: "Sıfırla",
        sec_results: "Sonuçlar",
        sec_trades: "Gerekli Takaslar",
        txt_total_kills: "Toplam Çağırma",
        txt_no_trades: "Takas gerekmiyor. Herkesin malzemesi uygun.",
        txt_gives: "verir",
        txt_to: "kişisine",
        txt_stygian_usage: "Stygian Stone Kullan",
        // Priority options
        priority_duriel: "Duriel",
        priority_andariel: "Andariel",
        priority_harbinger: "Harbinger",
        priority_balanced: "Dengeli",
        // Bosses
        boss_belial: "Belial",
        boss_harbinger: "Habercisi",
        boss_andariel: "Andariel",
        boss_duriel: "Duriel",
        boss_urivar: "Urivar",
        boss_zir: "Lord Zir",
        boss_beast: "Buzdaki Canavar",
        boss_grigoire: "Grigoire",
        boss_varshan: "Varshan",
        // Materials
        mat_husk: "Hainin Kabuğu",
        mat_abhorrent: "İğrenç Kalp",
        mat_doll: "İğneli Bebek",
        mat_shard: "Izdırap Parçası",
        mat_mask: "Yargıcın Maskesi",
        mat_blood: "Enfes Kan",
        mat_fear: "Damıtılmış Korku",
        mat_steel: "Canlı Çelik",
        mat_heart: "Habis Kalp",
        mat_stygian: "Stygian Stone",
        // Tutorial
        tut_welcome: "Diablo 4 boss rotasyonlarınızı optimize edin ve partiniz için mükemmel malzeme takaslarını hesaplayın.",
        tut_how_to: "Nasıl Kullanılır",
        tut_step1: "Tüm parti üyeleri için malzemeleri girin",
        tut_step2: "Aktif oyuncuların kutucuklarını işaretleyin (boş envanterleri otomatik algılar)",
        tut_step3: "Tercih ettiğiniz Stygian boss'unu seçin (Duriel/Andariel/Harbinger)",
        tut_step4: "Maksimum kesim ve takasları görmek için 'Optimize Et'e tıklayın",
        // Dialog & Feedback
        dlg_reset_title: "Tüm Verileri Sıfırla?",
        dlg_reset_message: "Bu işlem tüm malzeme girişlerini ve oyuncu isimlerini temizleyecek. Bu işlem geri alınamaz.",
        dlg_confirm: "Evet, Sıfırla",
        dlg_cancel: "İptal",
        btn_help: "Yardım",
        dlg_got_it: "Anladım!",
        toast_optimized: "Optimizasyon tamamlandı!",
        txt_no_materials: "Optimizasyon için en az bir oyuncuya malzeme girin.",
        sec_verification: "Dağılımı Doğrula",
        txt_after_trades: "Takaslardan sonra her oyuncuda olması gereken:",
        aria_player_toggle: "Oyuncu {0} aktiflik durumunu değiştir",
        aria_material_input: "Oyuncu {1} için {0} sayısı",
        aria_player_name: "Oyuncu {0} adı",
        // Share feature
        btn_share: "Paylaş",
        toast_link_copied: "Bağlantı panoya kopyalandı!",
        toast_link_error: "Bağlantı kopyalanamadı",
        toast_state_loaded: "Parti verileri bağlantıdan yüklendi!",
        // OCR feature
        btn_screenshot: "İçe Aktar",
        ocr_title: "Ekran Görüntüsünden İçe Aktar",
        ocr_drop_hint: "Ekran görüntüsünü buraya bırakın veya yüklemek için tıklayın",
        ocr_paste_hint: "Panodan da yapıştırabilirsiniz (Ctrl+V / Cmd+V)",
        ocr_processing: "Ekran görüntüsü analiz ediliyor...",
        ocr_error_no_materials: "Görüntüde malzeme bulunamadı",
        ocr_error_processing: "Görüntü işleme hatası",
        ocr_confirm: "Uygula",
        ocr_cancel: "İptal",
        ocr_detected: "Tespit Edilen Malzemeler",
        ocr_confidence: "Güven",
        ocr_edit_hint: "Uygulamadan önce değerleri düzenleyin",
        // Session/Party feature
        btn_create_session: "Parti Oluştur",
        btn_join_session: "Partiye Katıl",
        btn_leave: "Ayrıl",
        btn_ready: "Hazır",
        btn_unready: "Hazır Değil",
        btn_copy_code: "Kodu Kopyala",
        btn_copy_link: "Linki Kopyala",
        btn_join: "Katıl",
        btn_start_session: "Oturumu Başlat",
        lbl_session: "Parti",
        txt_you: "Sen",
        txt_ready: "hazır",
        txt_reconnecting: "Yeniden bağlanılıyor...",
        txt_session_created: "Parti başarıyla oluşturuldu!",
        txt_share_code: "Bu kodu parti üyelerinizle paylaşın",
        txt_create_session_info: "Yeni bir parti oturumu oluşturun ve 3 oyuncuyu davet edin.",
        dlg_create_session_title: "Parti Oluştur",
        dlg_join_session_title: "Partiye Katıl",
        placeholder_session_code: "6 haneli kodu girin",
        err_create_session: "Parti oluşturulamadı. Lütfen tekrar deneyin.",
        err_join_session: "Partiye katılınamadı. Kodu kontrol edip tekrar deneyin.",
        err_session_full: "Parti dolu",
        err_session_not_found: "Parti bulunamadı veya süresi doldu",
        txt_manual_entry: "Manuel",
        toast_session_full: "Bu parti dolu (4/4 oyuncu)",
        toast_code_copied: "Kod kopyalandı!",
        placeholder_player_name: "İsminiz (isteğe bağlı)",
        txt_waiting_ready: "Tüm oyuncuların hazır olması bekleniyor",
        txt_all_ready_required: "Optimize etmek için tüm çevrimiçi oyuncular hazır olmalı",
    }
};

// Material colors for visual distinction
export const MATERIAL_COLORS: Record<MaterialKey | 'stygian', string> = {
    mat_husk: '#6b7280',      // Gray
    mat_abhorrent: '#dc2626', // Red
    mat_doll: '#9333ea',      // Purple
    mat_shard: '#ea580c',     // Orange
    mat_mask: '#eab308',      // Yellow
    mat_blood: '#b91c1c',     // Dark red
    mat_fear: '#3b82f6',      // Blue
    mat_steel: '#6b7280',     // Steel gray
    mat_heart: '#16a34a',     // Green
    stygian: '#7c3aed',       // Violet
};

// Material icons mapping
export const MATERIAL_ICONS: Record<MaterialKey | 'stygian', string> = {
    mat_husk: '/icons/betrayershusk.webp',
    mat_abhorrent: '/icons/abhorrenthearts.webp',
    mat_doll: '/icons/pincushioneddoll.png',
    mat_shard: '/icons/shardofagony.png',
    mat_mask: '/icons/judicatorsmask.webp',
    mat_blood: '/icons/exquisiteblood.png',
    mat_fear: '/icons/distilledfear.png',
    mat_steel: '/icons/livingsteel.png',
    mat_heart: '/icons/malignantheart.png',
    stygian: '/icons/stygianstone.png',
};
