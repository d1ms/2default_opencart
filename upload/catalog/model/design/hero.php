<?php
class ModelDesignHero extends Model {
	public function getHero($hero_id) {
		$query = $this->db->query("SELECT * FROM " . DB_PREFIX . "hero h LEFT JOIN " . DB_PREFIX . "hero_description hd ON (h.hero_id = hd.hero_id) WHERE h.hero_id = '" . (int)$hero_id . "' AND h.status = '1' AND hd.language_id = '" . (int)$this->config->get('config_language_id') . "'");

		return $query->row;
	}
}
