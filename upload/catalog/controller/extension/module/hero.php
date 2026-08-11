<?php
class ControllerExtensionModuleHero extends Controller {
	public function index($setting) {
		static $module = 0;

		if (empty($setting['hero_id'])) {
			return '';
		}

		$this->load->model('design/hero');
		$this->load->model('tool/image');

		$hero_info = $this->model_design_hero->getHero($setting['hero_id']);

		if (!$hero_info) {
			return '';
		}

		$data['module'] = $module++;

		$data['eyebrow'] = $hero_info['eyebrow'];
		$data['title'] = $hero_info['title'];
		$data['description'] = $hero_info['description'];

		$data['button_1_text'] = $hero_info['button_1_text'];
		$data['button_1_link'] = $hero_info['button_1_link'];
		$data['button_2_text'] = $hero_info['button_2_text'];
		$data['button_2_link'] = $hero_info['button_2_link'];

		if ($hero_info['image'] && is_file(DIR_IMAGE . $hero_info['image'])) {
			$data['image'] = $this->model_tool_image->resize($hero_info['image'], 1600, 900);
		} else {
			$data['image'] = '';
		}

		return $this->load->view('extension/module/hero', $data);
	}
}
