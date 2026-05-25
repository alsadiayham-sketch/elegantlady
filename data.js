const DEFAULT_PRODUCTS = [];

const DEFAULT_DISCOUNTS = [];

const DEFAULT_SITE_SETTINGS = {
    whatsappNumber: '972569236758',
    heroSubtitle: 'أفضل الحقائب العالمية الاصلية في البلاد 👜✨',
    aboutText: 'أفضل الحقائب العالمية الاصلية في البلاد\n\nنوفر لكِ أفخم الحقائب من أشهر الماركات العالمية\nجميع منتجاتنا أصلية ومضمونة 100%\n\n📍 رام الله - شارع عين مصباح الرئيسي',
    instagramLink: 'https://www.instagram.com/elegant_ladyyyyy/',
    tiktokLink: ''
};

const BRANDS_DATA = [
    { name: 'Louis Vuitton', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Louis_Vuitton_logo_and_wordmark.svg/320px-Louis_Vuitton_logo_and_wordmark.svg.png' },
    { name: 'Gucci', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gucci_logo.svg/320px-Gucci_logo.svg.png' },
    { name: 'Chanel', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Chanel_logo-no-words.svg/320px-Chanel_logo-no-words.svg.png' },
    { name: 'Dior', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Dior_Logo.svg/320px-Dior_Logo.svg.png' },
    { name: 'Prada', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Prada-Logo.svg/320px-Prada-Logo.svg.png' },
    { name: 'Michael Kors', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Michael_Kors_logo.svg/320px-Michael_Kors_logo.svg.png' }
];

function normalizeSizeEntry(entry) {
    if (!entry) return { size: '', unit: 'ml', price: 0 };
    return {
        size: String(entry.size || '').trim(),
        unit: entry.unit === 'g' ? 'g' : 'ml',
        price: Number(entry.price) || 0
    };
}

function normalizeProduct(product) {
    const sizes = Array.isArray(product && product.sizes) && product.sizes.length
        ? product.sizes.map(normalizeSizeEntry)
        : [normalizeSizeEntry({ size: product && product.size, unit: product && product.unit, price: product && product.price })];

    return {
        id: Number(product && product.id) || Date.now(),
        name: (product && product.name) || '',
        brand: (product && product.brand) || '',
        category: (product && product.category) || '',
        sizes: sizes.filter(function (size) { return size.size && size.price >= 0; }),
        discount: Number(product && product.discount) || 0,
        image: (product && product.image) || '',
        status: (product && product.status) || 'normal'
    };
}

function normalizeProducts(list) {
    return (Array.isArray(list) ? list : []).map(normalizeProduct).sort(function (a, b) { return a.id - b.id; });
}

function normalizeDiscount(discount) {
    var values = [];
    if (discount && discount.values && Array.isArray(discount.values)) {
        values = discount.values;
    } else if (discount && discount.value) {
        values = String(discount.value).split(',').map(function(v) { return v.trim(); }).filter(Boolean);
    }
    return {
        id: String(discount && discount.id ? discount.id : Date.now()),
        type: ['brand', 'category', 'manual', 'all'].indexOf(discount && discount.type) >= 0 ? discount.type : 'manual',
        value: values.join(', '),
        values: values,
        percentage: Number(discount && discount.percentage) || 0,
        description: String(discount && discount.description ? discount.description : '').trim(),
        expiresAt: discount && discount.expiresAt ? discount.expiresAt : ''
    };
}

function normalizeDiscounts(list) {
    return (Array.isArray(list) ? list : []).map(normalizeDiscount);
}

function extractWhatsappNumber(input) {
    const raw = String(input || '').trim();
    if (!raw) return DEFAULT_SITE_SETTINGS.whatsappNumber;
    const fromLink = raw.indexOf('wa.me/') >= 0 ? raw.split('wa.me/')[1] : raw;
    return fromLink.replace(/[^\d]/g, '');
}

function buildWhatsAppUrl(number, message) {
    const safeNumber = extractWhatsappNumber(number);
    const text = message ? '?text=' + encodeURIComponent(message) : '';
    return 'https://wa.me/' + safeNumber + text;
}

function normalizeSettings(settings) {
    const source = settings || {};
    return {
        whatsappNumber: extractWhatsappNumber(source.whatsappNumber || source.whatsappLink || DEFAULT_SITE_SETTINGS.whatsappNumber),
        heroSubtitle: String(source.heroSubtitle || DEFAULT_SITE_SETTINGS.heroSubtitle),
        aboutText: String(source.aboutText || DEFAULT_SITE_SETTINGS.aboutText),
        instagramLink: String(source.instagramLink || DEFAULT_SITE_SETTINGS.instagramLink),
        tiktokLink: String(source.tiktokLink || DEFAULT_SITE_SETTINGS.tiktokLink)
    };
}

function getSizeData(product, sizeIdx) {
    if (!product || !Array.isArray(product.sizes) || !product.sizes.length) return { size: '', unit: 'ml', price: 0 };
    const safeIndex = Math.max(0, Math.min(Number(sizeIdx) || 0, product.sizes.length - 1));
    return product.sizes[safeIndex];
}

function getUnitLabel(unit) {
    return unit === 'g' ? 'غرام' : 'مل';
}

function getSizeLabel(sizeData) {
    return String(sizeData.size) + ' ' + getUnitLabel(sizeData.unit);
}

function getProductDiscountPercent(product, discounts) {
    let discountPercent = Number(product && product.discount) || 0;
    var now = new Date().toISOString().slice(0, 10);
    normalizeDiscounts(discounts).forEach(function (discount) {
        // Skip expired discounts
        if (discount.expiresAt && discount.expiresAt < now) return;
        // "all" applies to everything
        if (discount.type === 'all') discountPercent = Math.max(discountPercent, discount.percentage);
        if (discount.type === 'brand' && discount.values.indexOf(product.brand) >= 0) discountPercent = Math.max(discountPercent, discount.percentage);
        if (discount.type === 'category' && discount.values.indexOf(product.category) >= 0) discountPercent = Math.max(discountPercent, discount.percentage);
    });
    return discountPercent;
}

function getFinalPrice(product, sizeIdx, discounts) {
    const sizeData = getSizeData(product, sizeIdx);
    const discountPercent = getProductDiscountPercent(product, discounts || []);
    if (discountPercent > 0) {
        return {
            original: Number(sizeData.price) || 0,
            final: Math.round((Number(sizeData.price) || 0) * (1 - discountPercent / 100)),
            hasDiscount: true,
            discountPercent: discountPercent
        };
    }

    return {
        original: Number(sizeData.price) || 0,
        final: Number(sizeData.price) || 0,
        hasDiscount: false,
        discountPercent: 0
    };
}

function normalizeCartItems(cartItems, productsList) {
    const safeProducts = Array.isArray(productsList) ? productsList : [];
    return (Array.isArray(cartItems) ? cartItems : []).map(function (item) {
        const product = safeProducts.find(function (entry) { return entry.id === Number(item.id || item.productId); });
        const maxSizeIndex = product && product.sizes.length ? product.sizes.length - 1 : 0;
        const requestedSize = Number.isInteger(item.sizeIdx) ? item.sizeIdx : parseInt(item.sizeIdx || 0, 10) || 0;
        const sizeIdx = Math.max(0, Math.min(requestedSize, maxSizeIndex));
        return {
            id: Number(item.id || item.productId),
            sizeIdx: sizeIdx,
            qty: Math.max(1, parseInt(item.qty || 1, 10) || 1),
            price: Number(item.price) || (product ? getSizeData(product, sizeIdx).price : 0)
        };
    }).filter(function (item) {
        return item.id;
    });
}

function formatCurrency(value) {
    return '₪' + (Number(value) || 0);
}

function formatDateTime(dateValue) {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString('ar-PS', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function makeOrderId() {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let idx = 0; idx < 5; idx += 1) {
        code += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
    }
    return 'ORD-' + code;
}
