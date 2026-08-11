<?php
class ControllerDesignHero extends Controller {
	private $error = array();

	public function index() {
		$this->load->language('design/hero');

		$this->document->setTitle($this->language->get('heading_title'));

		$this->load->model('design/hero');

		$this->getList();
	}

	public function add() {
		$this->load->language('design/hero');

		$this->document->setTitle($this->language->get('heading_title'));

		$this->load->model('design/hero');

		if (($this->request->server['REQUEST_METHOD'] == 'POST') && $this->validateForm()) {
			$this->model_design_hero->addHero($this->request->post);

			$this->session->data['success'] = $this->language->get('text_success');

			$url = '';

			if (isset($this->request->get['sort'])) {
				$url .= '&sort=' . $this->request->get['sort'];
			}

			if (isset($this->request->get['order'])) {
				$url .= '&order=' . $this->request->get['order'];
			}

			if (isset($this->request->get['page'])) {
				$url .= '&page=' . $this->request->get['page'];
			}

			$this->response->redirect($this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . $url, true));
		}

		$this->getForm();
	}

	public function edit() {
		$this->load->language('design/hero');

		$this->document->setTitle($this->language->get('heading_title'));

		$this->load->model('design/hero');

		if (($this->request->server['REQUEST_METHOD'] == 'POST') && $this->validateForm()) {
			$this->model_design_hero->editHero($this->request->get['hero_id'], $this->request->post);

			$this->session->data['success'] = $this->language->get('text_success');

			$url = '';

			if (isset($this->request->get['sort'])) {
				$url .= '&sort=' . $this->request->get['sort'];
			}

			if (isset($this->request->get['order'])) {
				$url .= '&order=' . $this->request->get['order'];
			}

			if (isset($this->request->get['page'])) {
				$url .= '&page=' . $this->request->get['page'];
			}

			$this->response->redirect($this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . $url, true));
		}

		$this->getForm();
	}

	public function delete() {
		$this->load->language('design/hero');

		$this->document->setTitle($this->language->get('heading_title'));

		$this->load->model('design/hero');

		if (isset($this->request->post['selected']) && $this->validateDelete()) {
			foreach ($this->request->post['selected'] as $hero_id) {
				$this->model_design_hero->deleteHero($hero_id);
			}

			$this->session->data['success'] = $this->language->get('text_success');

			$url = '';

			if (isset($this->request->get['sort'])) {
				$url .= '&sort=' . $this->request->get['sort'];
			}

			if (isset($this->request->get['order'])) {
				$url .= '&order=' . $this->request->get['order'];
			}

			if (isset($this->request->get['page'])) {
				$url .= '&page=' . $this->request->get['page'];
			}

			$this->response->redirect($this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . $url, true));
		}

		$this->getList();
	}

	protected function getList() {
		if (isset($this->request->get['sort'])) {
			$sort = $this->request->get['sort'];
		} else {
			$sort = 'name';
		}

		if (isset($this->request->get['order'])) {
			$order = $this->request->get['order'];
		} else {
			$order = 'ASC';
		}

		if (isset($this->request->get['page'])) {
			$page = (int)$this->request->get['page'];
		} else {
			$page = 1;
		}

		$url = '';

		if (isset($this->request->get['sort'])) {
			$url .= '&sort=' . $this->request->get['sort'];
		}

		if (isset($this->request->get['order'])) {
			$url .= '&order=' . $this->request->get['order'];
		}

		if (isset($this->request->get['page'])) {
			$url .= '&page=' . $this->request->get['page'];
		}

		$data['breadcrumbs'] = array();

		$data['breadcrumbs'][] = array(
			'text' => $this->language->get('text_home'),
			'href' => $this->url->link('common/dashboard', 'user_token=' . $this->session->data['user_token'], true)
		);

		$data['breadcrumbs'][] = array(
			'text' => $this->language->get('heading_title'),
			'href' => $this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . $url, true)
		);

		$data['add'] = $this->url->link('design/hero/add', 'user_token=' . $this->session->data['user_token'] . $url, true);
		$data['delete'] = $this->url->link('design/hero/delete', 'user_token=' . $this->session->data['user_token'] . $url, true);

		$data['heros'] = array();

		$filter_data = array(
			'sort'  => $sort,
			'order' => $order,
			'start' => ($page - 1) * $this->config->get('config_limit_admin'),
			'limit' => $this->config->get('config_limit_admin')
		);

		$hero_total = $this->model_design_hero->getTotalHeros();

		$results = $this->model_design_hero->getHeros($filter_data);

		foreach ($results as $result) {
			$data['heros'][] = array(
				'hero_id' => $result['hero_id'],
				'name'    => $result['name'],
				'status'  => ($result['status'] ? $this->language->get('text_enabled') : $this->language->get('text_disabled')),
				'edit'    => $this->url->link('design/hero/edit', 'user_token=' . $this->session->data['user_token'] . '&hero_id=' . $result['hero_id'] . $url, true)
			);
		}

		if (isset($this->error['warning'])) {
			$data['error_warning'] = $this->error['warning'];
		} else {
			$data['error_warning'] = '';
		}

		if (isset($this->session->data['success'])) {
			$data['success'] = $this->session->data['success'];

			unset($this->session->data['success']);
		} else {
			$data['success'] = '';
		}

		if (isset($this->request->post['selected'])) {
			$data['selected'] = (array)$this->request->post['selected'];
		} else {
			$data['selected'] = array();
		}

		$url = '';

		if ($order == 'ASC') {
			$url .= '&order=DESC';
		} else {
			$url .= '&order=ASC';
		}

		if (isset($this->request->get['page'])) {
			$url .= '&page=' . $this->request->get['page'];
		}

		$data['sort_name'] = $this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . '&sort=name' . $url, true);
		$data['sort_status'] = $this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . '&sort=status' . $url, true);

		$url = '';

		if (isset($this->request->get['sort'])) {
			$url .= '&sort=' . $this->request->get['sort'];
		}

		if (isset($this->request->get['order'])) {
			$url .= '&order=' . $this->request->get['order'];
		}

		$pagination = new Pagination();
		$pagination->total = $hero_total;
		$pagination->page = $page;
		$pagination->limit = $this->config->get('config_limit_admin');
		$pagination->url = $this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . $url . '&page={page}', true);

		$data['pagination'] = $pagination->render();

		$data['results'] = sprintf($this->language->get('text_pagination'), ($hero_total) ? (($page - 1) * $this->config->get('config_limit_admin')) + 1 : 0, ((($page - 1) * $this->config->get('config_limit_admin')) > ($hero_total - $this->config->get('config_limit_admin'))) ? $hero_total : ((($page - 1) * $this->config->get('config_limit_admin')) + $this->config->get('config_limit_admin')), $hero_total, ceil($hero_total / $this->config->get('config_limit_admin')));

		$data['sort'] = $sort;
		$data['order'] = $order;

		$data['header'] = $this->load->controller('common/header');
		$data['column_left'] = $this->load->controller('common/column_left');
		$data['footer'] = $this->load->controller('common/footer');

		$this->response->setOutput($this->load->view('design/hero_list', $data));
	}

	protected function getForm() {
		$data['text_form'] = !isset($this->request->get['hero_id']) ? $this->language->get('text_add') : $this->language->get('text_edit');

		if (isset($this->error['warning'])) {
			$data['error_warning'] = $this->error['warning'];
		} else {
			$data['error_warning'] = '';
		}

		if (isset($this->error['name'])) {
			$data['error_name'] = $this->error['name'];
		} else {
			$data['error_name'] = '';
		}

		if (isset($this->error['title'])) {
			$data['error_title'] = $this->error['title'];
		} else {
			$data['error_title'] = array();
		}

		$url = '';

		if (isset($this->request->get['sort'])) {
			$url .= '&sort=' . $this->request->get['sort'];
		}

		if (isset($this->request->get['order'])) {
			$url .= '&order=' . $this->request->get['order'];
		}

		if (isset($this->request->get['page'])) {
			$url .= '&page=' . $this->request->get['page'];
		}

		$data['breadcrumbs'] = array();

		$data['breadcrumbs'][] = array(
			'text' => $this->language->get('text_home'),
			'href' => $this->url->link('common/dashboard', 'user_token=' . $this->session->data['user_token'], true)
		);

		$data['breadcrumbs'][] = array(
			'text' => $this->language->get('heading_title'),
			'href' => $this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . $url, true)
		);

		if (!isset($this->request->get['hero_id'])) {
			$data['action'] = $this->url->link('design/hero/add', 'user_token=' . $this->session->data['user_token'] . $url, true);
		} else {
			$data['action'] = $this->url->link('design/hero/edit', 'user_token=' . $this->session->data['user_token'] . '&hero_id=' . $this->request->get['hero_id'] . $url, true);
		}

		$data['cancel'] = $this->url->link('design/hero', 'user_token=' . $this->session->data['user_token'] . $url, true);

		if (isset($this->request->get['hero_id']) && ($this->request->server['REQUEST_METHOD'] != 'POST')) {
			$hero_info = $this->model_design_hero->getHero($this->request->get['hero_id']);
		}

		$data['user_token'] = $this->session->data['user_token'];

		if (isset($this->request->post['name'])) {
			$data['name'] = $this->request->post['name'];
		} elseif (!empty($hero_info)) {
			$data['name'] = $hero_info['name'];
		} else {
			$data['name'] = '';
		}

		if (isset($this->request->post['status'])) {
			$data['status'] = $this->request->post['status'];
		} elseif (!empty($hero_info)) {
			$data['status'] = $hero_info['status'];
		} else {
			$data['status'] = true;
		}

		$this->load->model('tool/image');

		if (isset($this->request->post['image'])) {
			$image = $this->request->post['image'];
		} elseif (!empty($hero_info)) {
			$image = $hero_info['image'];
		} else {
			$image = '';
		}

		$data['image'] = $image;

		if ($image && is_file(DIR_IMAGE . $image)) {
			$data['thumb'] = $this->model_tool_image->resize($image, 200, 200);
		} else {
			$data['thumb'] = $this->model_tool_image->resize('no_image.png', 200, 200);
		}

		$data['placeholder'] = $this->model_tool_image->resize('no_image.png', 200, 200);

		$this->load->model('localisation/language');

		$data['languages'] = $this->model_localisation_language->getLanguages();

		if (isset($this->request->post['hero_description'])) {
			$hero_description = $this->request->post['hero_description'];
		} elseif (isset($this->request->get['hero_id'])) {
			$hero_description = $this->model_design_hero->getHeroDescriptions($this->request->get['hero_id']);
		} else {
			$hero_description = array();
		}

		$data['hero_description'] = array();

		foreach ($data['languages'] as $language) {
			if (isset($hero_description[$language['language_id']])) {
				$data['hero_description'][$language['language_id']] = $hero_description[$language['language_id']];
			} else {
				$data['hero_description'][$language['language_id']] = array(
					'eyebrow'       => '',
					'title'         => '',
					'description'   => '',
					'button_1_text' => '',
					'button_1_link' => '',
					'button_2_text' => '',
					'button_2_link' => ''
				);
			}
		}

		$data['header'] = $this->load->controller('common/header');
		$data['column_left'] = $this->load->controller('common/column_left');
		$data['footer'] = $this->load->controller('common/footer');

		$this->response->setOutput($this->load->view('design/hero_form', $data));
	}

	protected function validateForm() {
		if (!$this->user->hasPermission('modify', 'design/hero')) {
			$this->error['warning'] = $this->language->get('error_permission');
		}

		if ((utf8_strlen($this->request->post['name']) < 3) || (utf8_strlen($this->request->post['name']) > 64)) {
			$this->error['name'] = $this->language->get('error_name');
		}

		if (isset($this->request->post['hero_description'])) {
			foreach ($this->request->post['hero_description'] as $language_id => $hero_description) {
				if ($hero_description['title'] && ((utf8_strlen($hero_description['title']) < 1) || (utf8_strlen($hero_description['title']) > 255))) {
					$this->error['title'][$language_id] = $this->language->get('error_title');
				}
			}
		}

		return !$this->error;
	}

	protected function validateDelete() {
		if (!$this->user->hasPermission('modify', 'design/hero')) {
			$this->error['warning'] = $this->language->get('error_permission');
		}

		return !$this->error;
	}
}
