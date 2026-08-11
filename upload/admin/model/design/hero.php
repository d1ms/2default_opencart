<?php
class ModelDesignHero extends Model {
	public function addHero($data) {
		$this->db->query("INSERT INTO `" . DB_PREFIX . "hero` SET `name` = '" . $this->db->escape($data['name']) . "', `image` = '" . $this->db->escape($data['image']) . "', `status` = '" . (int)$data['status'] . "', `date_added` = NOW()");

		$hero_id = $this->db->getLastId();

		if (isset($data['hero_description'])) {
			foreach ($data['hero_description'] as $language_id => $hero_description) {
				$this->db->query("INSERT INTO `" . DB_PREFIX . "hero_description` SET `hero_id` = '" . (int)$hero_id . "', `language_id` = '" . (int)$language_id . "', `eyebrow` = '" . $this->db->escape($hero_description['eyebrow']) . "', `title` = '" . $this->db->escape($hero_description['title']) . "', `description` = '" . $this->db->escape($hero_description['description']) . "', `button_1_text` = '" . $this->db->escape($hero_description['button_1_text']) . "', `button_1_link` = '" . $this->db->escape($hero_description['button_1_link']) . "', `button_2_text` = '" . $this->db->escape($hero_description['button_2_text']) . "', `button_2_link` = '" . $this->db->escape($hero_description['button_2_link']) . "'");
			}
		}

		return $hero_id;
	}

	public function editHero($hero_id, $data) {
		$this->db->query("UPDATE `" . DB_PREFIX . "hero` SET `name` = '" . $this->db->escape($data['name']) . "', `image` = '" . $this->db->escape($data['image']) . "', `status` = '" . (int)$data['status'] . "' WHERE `hero_id` = '" . (int)$hero_id . "'");

		$this->db->query("DELETE FROM `" . DB_PREFIX . "hero_description` WHERE `hero_id` = '" . (int)$hero_id . "'");

		if (isset($data['hero_description'])) {
			foreach ($data['hero_description'] as $language_id => $hero_description) {
				$this->db->query("INSERT INTO `" . DB_PREFIX . "hero_description` SET `hero_id` = '" . (int)$hero_id . "', `language_id` = '" . (int)$language_id . "', `eyebrow` = '" . $this->db->escape($hero_description['eyebrow']) . "', `title` = '" . $this->db->escape($hero_description['title']) . "', `description` = '" . $this->db->escape($hero_description['description']) . "', `button_1_text` = '" . $this->db->escape($hero_description['button_1_text']) . "', `button_1_link` = '" . $this->db->escape($hero_description['button_1_link']) . "', `button_2_text` = '" . $this->db->escape($hero_description['button_2_text']) . "', `button_2_link` = '" . $this->db->escape($hero_description['button_2_link']) . "'");
			}
		}
	}

	public function deleteHero($hero_id) {
		$this->db->query("DELETE FROM `" . DB_PREFIX . "hero` WHERE `hero_id` = '" . (int)$hero_id . "'");
		$this->db->query("DELETE FROM `" . DB_PREFIX . "hero_description` WHERE `hero_id` = '" . (int)$hero_id . "'");
	}

	public function getHero($hero_id) {
		$query = $this->db->query("SELECT DISTINCT * FROM `" . DB_PREFIX . "hero` WHERE `hero_id` = '" . (int)$hero_id . "'");

		return $query->row;
	}

	public function getHeros($data = array()) {
		$sql = "SELECT * FROM `" . DB_PREFIX . "hero`";

		$sort_data = array(
			'name',
			'status'
		);

		if (isset($data['sort']) && in_array($data['sort'], $sort_data)) {
			$sql .= " ORDER BY `" . $data['sort'] . "`";
		} else {
			$sql .= " ORDER BY `name`";
		}

		if (isset($data['order']) && ($data['order'] == 'DESC')) {
			$sql .= " DESC";
		} else {
			$sql .= " ASC";
		}

		if (isset($data['start']) || isset($data['limit'])) {
			if ($data['start'] < 0) {
				$data['start'] = 0;
			}

			if ($data['limit'] < 1) {
				$data['limit'] = 20;
			}

			$sql .= " LIMIT " . (int)$data['start'] . "," . (int)$data['limit'];
		}

		$query = $this->db->query($sql);

		return $query->rows;
	}

	public function getHeroDescriptions($hero_id) {
		$hero_description_data = array();

		$query = $this->db->query("SELECT * FROM `" . DB_PREFIX . "hero_description` WHERE `hero_id` = '" . (int)$hero_id . "'");

		foreach ($query->rows as $result) {
			$hero_description_data[$result['language_id']] = array(
				'eyebrow'       => $result['eyebrow'],
				'title'         => $result['title'],
				'description'   => $result['description'],
				'button_1_text' => $result['button_1_text'],
				'button_1_link' => $result['button_1_link'],
				'button_2_text' => $result['button_2_text'],
				'button_2_link' => $result['button_2_link']
			);
		}

		return $hero_description_data;
	}

	public function getTotalHeros() {
		$query = $this->db->query("SELECT COUNT(*) AS total FROM `" . DB_PREFIX . "hero`");

		return $query->row['total'];
	}

	public function install() {
		$this->db->query("
		CREATE TABLE IF NOT EXISTS `" . DB_PREFIX . "hero` (
		  `hero_id` int(11) NOT NULL AUTO_INCREMENT,
		  `name` varchar(64) NOT NULL,
		  `image` varchar(255) NOT NULL DEFAULT '',
		  `status` tinyint(1) NOT NULL DEFAULT '1',
		  `date_added` datetime NOT NULL,
		  PRIMARY KEY (`hero_id`)
		) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
		");

		$this->db->query("
		CREATE TABLE IF NOT EXISTS `" . DB_PREFIX . "hero_description` (
		  `hero_id` int(11) NOT NULL,
		  `language_id` int(11) NOT NULL,
		  `eyebrow` varchar(255) NOT NULL DEFAULT '',
		  `title` varchar(255) NOT NULL DEFAULT '',
		  `description` text NOT NULL,
		  `button_1_text` varchar(64) NOT NULL DEFAULT '',
		  `button_1_link` varchar(255) NOT NULL DEFAULT '',
		  `button_2_text` varchar(64) NOT NULL DEFAULT '',
		  `button_2_link` varchar(255) NOT NULL DEFAULT '',
		  PRIMARY KEY (`hero_id`,`language_id`)
		) ENGINE=MyISAM DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;
		");
	}

	public function uninstall() {
		$this->db->query("DROP TABLE IF EXISTS `" . DB_PREFIX . "hero_description`");
		$this->db->query("DROP TABLE IF EXISTS `" . DB_PREFIX . "hero`");
	}
}
