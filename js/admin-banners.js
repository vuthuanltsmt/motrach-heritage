import { supabase } from './supabase-client.js';

// Moi thao tac ghi phai duoc RLS Supabase cho phep; kiem tra o JS chi de dieu huong.
const $ = id => document.getElementById(id);
const rootUrl = new URL('../', document.baseURI);
let banners = [];
let currentEditId = null;
let previewUrl = null;
let working = false;

function status(message, type = '') {
  const element = $('pageStatus');
  element.textContent = message;
  element.className = `page-status ${type}`;
}
function safeUrl(value) {
  if (!value || typeof value !== 'string') return '';
  try {
    const url = new URL(value, rootUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    // Relative URLs are reserved for static pictures on this website.
    if (!/^[a-z][a-z\d+.-]*:\/\//i.test(value) &&
        !url.pathname.startsWith(new URL('images/', rootUrl).pathname)) return '';
    return url.href;
  } catch { return ''; }
}
function preview(value) {
  const img = $('imagePreview');
  const url = (previewUrl && value === previewUrl && value.startsWith('blob:')) ? value : safeUrl(value);
  img.hidden = !url;
  $('previewPlaceholder').hidden = Boolean(url);
  if (url) img.src = url;
  else img.removeAttribute('src');
}
function clearPreviewObjectUrl() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
}
function resetForm() {
  $('bannerForm').reset();
  $('editingId').value = '';
  currentEditId = null;
  $('formHeading').textContent = 'Thêm Banner';
  $('saveButton').textContent = 'Lưu Banner';
  clearPreviewObjectUrl();
  preview('');
}
function startEdit(item) {
  resetForm();
  currentEditId = item.id;
  $('editingId').value = item.id;
  $('titleVi').value = item.title_vi || '';
  $('titleEn').value = item.title_en || '';
  $('descriptionVi').value = item.description_vi || '';
  $('descriptionEn').value = item.description_en || '';
  $('durationMs').value = String(item.duration_ms || 6500);
  if (!$('durationMs').value) {
    const custom = new Option(`${Number(item.duration_ms) / 1000} giây`, item.duration_ms);
    $('durationMs').append(custom);
    $('durationMs').value = String(item.duration_ms);
  }
  $('isActive').checked = item.is_active;
  $('formHeading').textContent = 'Chỉnh sửa Banner';
  $('saveButton').textContent = 'Lưu thay đổi';
  preview(item.image_url);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function button(text, callback, className = '') {
  const el = document.createElement('button');
  el.type = 'button';
  el.textContent = text;
  if (className) el.className = className;
  el.addEventListener('click', callback);
  return el;
}
function renderList() {
  const container = $('bannerList');
  container.replaceChildren();
  $('bannerCount').textContent = `${banners.length} Banner, ${banners.filter(b => b.is_active).length} đang hiển thị`;
  if (!banners.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Chưa có Banner. Hãy sử dụng biểu mẫu bên trái để thêm.';
    container.append(empty);
    return;
  }
  banners.forEach((item, index) => {
    const article = document.createElement('article'); article.className = 'banner-item';
    const image = document.createElement('img');
    const imageUrl = safeUrl(item.image_url);
    if (imageUrl) image.src = imageUrl;
    image.loading = 'lazy'; image.alt = item.title_vi || 'Ảnh Banner';
    const info = document.createElement('div'); info.className = 'banner-info';
    const title = document.createElement('h3'); title.textContent = `${index + 1}. ${item.title_vi}`;
    const summary = document.createElement('p'); summary.textContent = `${item.description_vi || 'Không có mô tả'} · ${Number(item.duration_ms)/1000} giây`;
    const flag = document.createElement('span'); flag.className = `pill${item.is_active ? '' : ' off'}`; flag.textContent = item.is_active ? '● Đang bật' : '○ Đã tắt';
    const actions = document.createElement('div'); actions.className = 'banner-actions';
    const up = button('↑ Lên', () => reorder(index, -1)); up.disabled = index === 0;
    const down = button('↓ Xuống', () => reorder(index, 1)); down.disabled = index === banners.length - 1;
    actions.append(button('✎ Sửa', () => startEdit(item)), button(item.is_active ? 'Ẩn' : 'Hiện', () => toggle(item)), up, down, button('Xóa', () => remove(item), 'danger'));
    info.append(title, summary, flag, actions); article.append(image, info); container.append(article);
  });
}
async function reload() {
  const { data, error } = await supabase.from('site_banners')
    .select('id,image_url,storage_path,title_vi,title_en,description_vi,description_en,sort_order,duration_ms,is_active,created_at')
    .order('sort_order', { ascending: true }).order('created_at', { ascending: true });
  if (error) throw error;
  banners = data || [];
  renderList();
}
async function withBusy(callback) {
  if (working) return;
  working = true;
  $('saveButton').disabled = true;
  $('refreshButton').disabled = true;
  try { await callback(); }
  catch (error) {
    console.error('Banner operation failed:', error);
    status(`Không thực hiện được: ${error.message || 'Lỗi không xác định'}. Kiểm tra SQL và quyền quản trị.`, 'error');
  } finally {
    working = false;
    $('saveButton').disabled = false;
    $('refreshButton').disabled = false;
  }
}
async function save(event) {
  event.preventDefault();
  await withBusy(async () => {
    const title = $('titleVi').value.trim();
    if (!title) throw new Error('Vui lòng nhập tiêu đề tiếng Việt');
    const file = $('imageFile').files[0];
    if (!currentEditId && !file) throw new Error('Banner mới cần có ảnh');
    const values = {
      title_vi: title,
      title_en: $('titleEn').value.trim(),
      description_vi: $('descriptionVi').value.trim(),
      description_en: $('descriptionEn').value.trim(),
      duration_ms: Number($('durationMs').value),
      is_active: $('isActive').checked
    };
    if (!Number.isInteger(values.duration_ms) || values.duration_ms < 3000 || values.duration_ms > 20000) {
      throw new Error('Thời gian chuyển phải từ 3–20 giây');
    }
    const previous = banners.find(item => item.id === currentEditId);
    let freshStoragePath = '';
    if (file) {
      const mime = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
      if (!mime) throw new Error('Chỉ nhận ảnh JPG, PNG, WebP');
      if (file.size > 5*1024*1024) throw new Error('Ảnh phải nhỏ hơn hoặc bằng 5 MB');
      freshStoragePath = `slides/${crypto.randomUUID()}.${mime}`;
      status('Đang tải ảnh lên Supabase...');
      const { error: uploadError } = await supabase.storage.from('banner-images').upload(freshStoragePath, file, {
        contentType: file.type, cacheControl: '3600', upsert: false
      });
      if (uploadError) throw uploadError;
      values.image_url = supabase.storage.from('banner-images').getPublicUrl(freshStoragePath).data.publicUrl;
      values.storage_path = freshStoragePath;
    } else if (previous) {
      values.image_url = previous.image_url;
      values.storage_path = previous.storage_path;
    }
    if (!currentEditId) values.sort_order = banners.length ? Math.max(...banners.map(item => item.sort_order)) + 10 : 10;
    status('Đang lưu Banner...');
    const request = currentEditId
      ? supabase.from('site_banners').update(values).eq('id', currentEditId).select('id')
      : supabase.from('site_banners').insert(values).select('id');
    const { data, error } = await request;
    if (error || !data?.length) {
      // Only remove the newly uploaded object after an unsuccessful DB write.
      if (freshStoragePath) await supabase.storage.from('banner-images').remove([freshStoragePath]);
      throw error || new Error('Không có quyền cập nhật Banner');
    }
    resetForm(); await reload();
    status('Đã lưu thành công. Trang chủ sẽ đọc dữ liệu Banner mới khi tải lại.', 'ok');
  });
}
async function toggle(item) {
  await withBusy(async () => {
    const { data, error } = await supabase.from('site_banners')
      .update({ is_active: !item.is_active }).eq('id', item.id).select('id');
    if (error || !data?.length) throw error || new Error('Không có quyền đổi trạng thái');
    await reload(); status('Đã thay đổi trạng thái Banner.', 'ok');
  });
}
async function remove(item) {
  if (!window.confirm(`Xóa Banner “${item.title_vi}” khỏi danh sách? Ảnh nguồn không bị xóa.`)) return;
  await withBusy(async () => {
    const { data, error } = await supabase.from('site_banners').delete().eq('id', item.id).select('id');
    if (error || !data?.length) throw error || new Error('Không có quyền xóa');
    if (item.id === currentEditId) resetForm();
    await reload(); status('Đã xóa Banner khỏi danh sách. Ảnh nguồn vẫn được giữ.', 'ok');
  });
}
async function reorder(index, displacement) {
  const otherIndex = index + displacement;
  if (otherIndex < 0 || otherIndex >= banners.length) return;
  await withBusy(async () => {
    const next = banners.map(item => item.id);
    [next[index], next[otherIndex]] = [next[otherIndex], next[index]];
    const { error } = await supabase.rpc('reorder_site_banners', { p_ids: next });
    if (error) throw error;
    await reload(); status('Đã thay đổi thứ tự Banner.', 'ok');
  });
}
async function initialize() {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) { window.location.replace('login.html'); return; }
    const { data: admin, error: adminError } = await supabase.from('admins')
      .select('user_id').eq('user_id', user.id).maybeSingle();
    if (adminError || !admin) { window.location.replace('index.html'); return; }
    $('bannerWorkspace').hidden = false;
    $('bannerForm').addEventListener('submit', save);
    $('cancelButton').addEventListener('click', resetForm);
    $('refreshButton').addEventListener('click', () => withBusy(async () => { await reload(); status('Danh sách đã cập nhật.', 'ok'); }));
    $('imageFile').addEventListener('change', () => {
      clearPreviewObjectUrl();
      const file = $('imageFile').files[0];
      if (file) { previewUrl = URL.createObjectURL(file); preview(previewUrl); }
      else preview(banners.find(item => item.id === currentEditId)?.image_url || '');
    });
    await reload(); status('Đã kết nối Supabase. Bạn có thể quản lý Banner.', 'ok');
  } catch (error) {
    console.error('Could not initialize banner admin:', error);
    status('Chưa tải được danh sách Banner. Hãy kiểm tra đã chạy SQL 002 và kết nối Supabase.', 'error');
  }
}
initialize();
