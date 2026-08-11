<?php
$this->load->model('user/user_group');

$this->model_user_user_group->addPermission($this->user->getGroupId(), 'access', 'extension/theme/2default');
$this->model_user_user_group->addPermission($this->user->getGroupId(), 'modify', 'extension/theme/2default'); 

$this->model_user_user_group->addPermission($this->user->getGroupId(), 'access', 'design/hero');
$this->model_user_user_group->addPermission($this->user->getGroupId(), 'modify', 'design/hero'); 

$this->load->model('design/hero');
$this->model_design_hero->install();

$hero_query = $this->db->query("SELECT COUNT(*) AS total FROM `" . DB_PREFIX . "hero`");

if ($hero_query->row['total'] == 0) {
    $this->db->query("INSERT INTO `" . DB_PREFIX . "hero` SET `name` = 'Demo Hero — Home Top', `image` = 'catalog/Без имени.png', `status` = 1, `date_added` = NOW()");
    $hero_id = $this->db->getLastId();

    $languages_query = $this->db->query("SELECT `language_id`, `code` FROM `" . DB_PREFIX . "language`");
    foreach ($languages_query->rows as $lang) {
        $code = strtolower($lang['code']);
        if (strpos($code, 'ru') !== false) {
            $eyebrow       = 'Новая коллекция 2026';
            $title         = 'Стиль, который двигается вместе с вами';
            $description   = 'Свежие поступления каждую неделю — качественные вещи по честным ценам, с доставкой по всей стране.';
            $button_1_text = 'Смотреть каталог';
            $button_1_link = 'index.php?route=product/category&path=20';
            $button_2_text = 'Акции';
            $button_2_link = 'index.php?route=product/special';
        } else {
            $eyebrow       = '2026 Collection';
            $title         = 'Style that moves with you';
            $description   = 'Fresh arrivals every week — quality pieces at honest prices, delivered nationwide.';
            $button_1_text = 'Shop the catalog';
            $button_1_link = 'index.php?route=product/category&path=20';
            $button_2_text = 'Special offers';
            $button_2_link = 'index.php?route=product/special';
        }

        $this->db->query("INSERT INTO `" . DB_PREFIX . "hero_description` SET 
            `hero_id` = '" . (int)$hero_id . "',
            `language_id` = '" . (int)$lang['language_id'] . "',
            `eyebrow` = '" . $this->db->escape($eyebrow) . "',
            `title` = '" . $this->db->escape($title) . "',
            `description` = '" . $this->db->escape($description) . "',
            `button_1_text` = '" . $this->db->escape($button_1_text) . "',
            `button_1_link` = '" . $this->db->escape($button_1_link) . "',
            `button_2_text` = '" . $this->db->escape($button_2_text) . "',
            `button_2_link` = '" . $this->db->escape($button_2_link) . "'
        ");
    }

    $module_setting = json_encode(array(
        'name'    => 'Hero Demo',
        'hero_id' => (string)$hero_id,
        'status'  => '1'
    ));

    $this->db->query("INSERT INTO `" . DB_PREFIX . "module` SET `name` = 'Hero Demo', `code` = 'hero', `setting` = '" . $this->db->escape($module_setting) . "'");
    $module_id = $this->db->getLastId();

    $layout_query = $this->db->query("SELECT `layout_id` FROM `" . DB_PREFIX . "layout_route` WHERE `route` = 'common/home' LIMIT 1");
    $layout_id = !empty($layout_query->row['layout_id']) ? (int)$layout_query->row['layout_id'] : 1;

    $module_code = 'hero.' . $module_id;
    $check_layout = $this->db->query("SELECT COUNT(*) AS total FROM `" . DB_PREFIX . "layout_module` WHERE `layout_id` = '" . (int)$layout_id . "' AND `code` = '" . $this->db->escape($module_code) . "'");

    if ($check_layout->row['total'] == 0) {
        $this->db->query("INSERT INTO `" . DB_PREFIX . "layout_module` SET `layout_id` = '" . (int)$layout_id . "', `code` = '" . $this->db->escape($module_code) . "', `position` = 'content_top', `sort_order` = 0");
    }
}

