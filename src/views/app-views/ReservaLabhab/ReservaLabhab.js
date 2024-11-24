import React from 'react';
import { useState, useEffect } from 'react';
import { Form, Select, Input, Button, message, Row, Col, Upload,Card} from 'antd';
import { useParams,useNavigate } from 'react-router-dom';
import Header from '../../../layouts/Header/Header';
import { Link } from 'react-router-dom';
import { UploadOutlined } from '@ant-design/icons';
import { InfoCircleOutlined } from '@ant-design/icons';
import SlideMenu from '../../../layouts/Slidemenu/Slidemenu';
import formAlert from '../../../assets/images/form-alert.png';
import axios from 'axios';
import moment from 'moment';

/// 

function ReservaLabhab() {
  const navigate = useNavigate();
  const { id } = useParams();  // Aqui pegamos o valor do parâmetro id da URL
  const [horariosDisponiveis, setHorariosDisponiveis] = useState([]);
  const [showCard, setShowCard] = useState(false); 
  const [form] = Form.useForm();  // Inicializando o hook useForm
  const [isEdit, setIsEdit] = useState(false); // Novo estado para identificar se é edição ou criação
  
  

  

  useEffect(() => {
    if (id) {
      setIsEdit(true); 
      axios.put(http://localhost:8080/reservas-labhab/editar/${id})
        .then(response => {
       
          form.setFieldsValue({
            disciplina: response.data.disciplina,
            data: moment(response.data.data).format('YYYY-MM-DD'),
            turno: response.data.turno,
            laboratorio: response.data.laboratorio,
            hora_inicio: response.data.hora_inicio,
            hora_fim: response.data.hora_fim,
            observacao: response.data.observacao,
            reserva_dia: response.data.reserva_dia,
          });
  
          // Configura horários disponíveis dependendo do turno
          handleTurno(response.data.turno);
        })
        .catch(error => console.error('Erro ao carregar os dados:', error));
    }
  }, [id]);  // O efeito só será executado novamente quando o id mudar
  

  const onFinish = async (values) => {
    try {
      const formattedValues = {
        disciplina: values.disciplina,
        data: values.data,
        turno: values.turno,
        laboratorio: values.laboratorio,
        hora_inicio: values.hora_inicio, 
        hora_fim: values.hora_fim,       
        observacao: values.observacao,
        reserva_dia: values.reserva_dia,
        id_usuario: localStorage.getItem('userId'),
      };

      let response;
      if (isEdit) {
        // Se for edição, use PUT
        response = await axios.put(http://localhost:8080/reservas-labhab/editar/${id}, formattedValues);
        message.success('Reserva editada com sucesso!');
        navigate('/minhas_reservas');
      } else {
        // Se for criação, use POST
        response = await axios.post('http://localhost:8080/reservas-labhab/criar', formattedValues);
        message.success('Reserva realizada com sucesso!');
      }
      
      console.log('Resposta da API:', response.data);
      form.resetFields();
    } catch (error) {
      console.error('Erro ao realizar a reserva:', error.response ? error.response.data : error);
      message.error('Erro ao realizar a reserva. Tente novamente.');
    }
  };

  const onFinishFailed = (errorInfo) => {
    console.log('Falha no envio:', errorInfo);
  };
 


  const handleTurno = (turno) => {
    let horarios = {
      'manhã': ['08:00', '09:00', '10:00', '11:00','12:00'],
      'tarde': ['13:00', '14:00', '15:00', '16:00', '17:00'],
      'noite': ['19:00', '20:00', '21:00', '22:00'],
    };

    setHorariosDisponiveis(horarios[turno] || []);

    
    if (horarios[turno]) {
      form.setFieldsValue({
        hora_inicio: horarios[turno][0],
        hora_fim: horarios[turno][horarios[turno].length - 1],
      });
    } else {
      form.resetFields(['hora_inicio', 'hora_fim']);
    }
  };

  const handleInfoClick = () => {
    setShowCard(!showCard); // Alterna a exibição do card de reservas
  };

 
  
  return (
    <div>
      <Header />
      <div className="reservas-title">
        <p>
          <Link to="/reservas">Reservas</Link> &gt; Reserva Laboratório de Habilidades
        </p>
        <h1>
          <Link to="/reservas">&#8592; </Link> Reserva de Laboratórios de Habilidades
          {/* Ícone de informação que, ao ser clicado, exibe o card */}
          <InfoCircleOutlined 
            style={{ marginLeft: 10, fontSize: '20px', cursor: 'pointer' }} 
            onClick={handleInfoClick} 
          />
        </h1>
            {/* Card que será exibido ao clicar no ícone */}
      {showCard && (
        <Card className="info-card" style={{ zIndex:"1001",position: 'absolute', top: '60px', right: '150px', width: 300 }}>
          <p>Laboratórios de habilidades só podem ser reservados no mínimo 3 dias de antecedência.</p>
          <Button type="primary" onClick={handleInfoClick}>Fechar</Button>
        </Card> 
      )}
      </div>
      
      
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={onFinishFailed}
      >
        <Row gutter={16} className="reserva-container">
          <Col xs={24} md={12}>
            <Form.Item 
              label="Disciplina" 
              name="disciplina"
              rules={[{ required: true, message: 'Campo obrigatório' }]}
            >
              <Input placeholder='Digite a disciplina' />
            </Form.Item>
            <Form.Item 
              label="Laboratório" 
              name="laboratorio" 
              rules={[{ required: true, message: 'Campo obrigatório' }]}
            >
              <Select placeholder="Selecione o tipo de reserva">
                <Select.Option value="laboratorio de quimica">Laboratório de Química</Select.Option>
                <Select.Option value="laboratorio de armacogonozia">Laboratório de Farmacognosia</Select.Option>
                <Select.Option value="laboratorio de instrumental">Laboratório de Instrumental</Select.Option>
              
              </Select>
            </Form.Item>
            <Form.Item label="Anexar POP">
              <Upload beforeUpload={() => false}>
                <Button icon={<UploadOutlined />}>Selecione o arquivo</Button>
              </Upload>
            </Form.Item>
            <Form.Item label="Observação">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">Realizar Reserva</Button>
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item 
              label="Data" 
              name="data"
              rules={[{ required: true, message: <span>
                Campo obrigatório <img src={formAlert} alt="Alerta" style={{ width: 10, marginLeft: 2 }} />
              </span>}]}
            >
              <Input type="date" />
            </Form.Item>
            <Form.Item 
              label="Turno"
              name="turno"
           
              rules={[{ required: true, message: 'Campo obrigatório' }]}
            >
              <Select placeholder="Selecione o turno"  onChange={handleTurno}> 
                <Select.Option value="manhã">Manhã</Select.Option>
                <Select.Option value="tarde">Tarde</Select.Option>
                <Select.Option value="noite">Noite</Select.Option>
              </Select>
            </Form.Item>
            <div className="horario-container">
              <Form.Item 
                label="Horário Início" 
                className="horario-item"
                name="hora_inicio" 
                rules={[{ required: true, message: 'Campo obrigatório' }]}
              >
                <Select placeholder="Selecione o horário de início">
                  {horariosDisponiveis.map(horario => (
                    <Select.Option key={horario} value={horario}>
                      {horario}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item 
                label="Horário Fim" 
                className="horario-item"
                name="hora_fim" 
                rules={[{ required: true, message: 'Campo obrigatório' }]}
              >
                <Select placeholder="Selecione o horário de fim">
                  {horariosDisponiveis.map(horario => (
                    <Select.Option key={horario} value={horario}>
                      {horario}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>
          
            <Form.Item label="Realizar a reserva até o final do semestre para todo o dia da semana selecionado ?" name="reserva_dia">
              <Select placeholder="Selecione o dia da semana">
                <Select.Option value="segunda">Segunda</Select.Option>
                <Select.Option value="terca">Terça</Select.Option>
                <Select.Option value="quarta">Quarta</Select.Option>
                <Select.Option value="quinta">Quinta</Select.Option>
                <Select.Option value="sexta">Sexta</Select.Option>
                <Select.Option value="sabado">Sábado</Select.Option>
                <Select.Option value="domingo">Domingo</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <SlideMenu/>
    </div>
  );
}

export default ReservaLabhab;