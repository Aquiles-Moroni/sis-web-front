import React, { useState, useEffect } from 'react';
import { Table, Button, Dropdown, Menu, Checkbox, Modal,message } from 'antd';
import Header from '../../../layouts/Header/Header';
import { Link } from 'react-router-dom';
import '../Reservas/Reservas.css';
import SlideMenu from '../../../layouts/Slidemenu/Slidemenu';
import axios from 'axios';
import statusEnum from '../../../enum/statusEnum';
import moment from 'moment';


const localOptions = [
  { label: 'Laboratorios de Habilidades', value: 'laboratorio de instrumental' },
  { label: 'Laboratorio de Informatica', value: 'laboratorio de informatica' },
  { label: 'Salas, Auditórios, Plenário, Salão de Atos', value: ['plenario', 'salao de atos', 'sala de aula', 'auditorios'] }
];


const statusOptions = [
  { label: 'Ativo', value: 'Ativo' },
  { label: 'Aprovado', value: 'Aprovado'},
  { label: 'Pendente', value: 'Pendente'},
  { label: 'Rejeitado', value: 'Rejeitado'},
  { label: 'Finalizado', value: 'Finalizado'},
];

const showConfirm = (title, content, onConfirm) => {
  Modal.confirm({
    title,
    content,
    okText: 'Confirmar',
    cancelText: 'Cancelar',
    onOk() {
      onConfirm();
    },
  });
};



function MinhasReservas() {
  const [selectedLocal, setSelectedLocal] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [dataSource, setDataSource] = useState([]);
  const [refresh,setRefresh]= useState(0)
  const userId = localStorage.getItem('userId');


  

  useEffect(() => {
    const fetchReservas = async () => {
      try {
        const response = await axios.get('http://localhost:8080/reservas-gerais/listar', {
          params: { userId: userId } // Substitua `seuUserId` pelo ID real do usuário
        });
        
        setDataSource(response.data);
      } catch (error) {
        console.error('Erro ao buscar reservas:', error);
      }
    };

    fetchReservas();
  }, [refresh]);


  const handleDelete = async (record) => {
    showConfirm(
      'Confirmar Exclusão',
      'Você tem certeza que deseja excluir esta reserva?',
      async () => {
        try {
          if (record.id_usuario === Number(userId) && (record.status === 1 || record.status === 4)) {
            // Executando todas as requisições com Promise.allSettled para capturar o status de cada uma
            const responses = await Promise.allSettled([
              axios.delete(`http://localhost:8080/reservas-labinfo/deletar/${record.id}`, {
                headers: {
                  userId: userId,
                },
              }),
              axios.delete(`http://localhost:8080/reservas-sala/deletar/${record.id}`, {
                headers: {
                  userId: userId,
                },
              }),
              axios.delete(`http://localhost:8080/reservas-labhab/deletar/${record.id}`, {
                headers: {
                  userId: userId,
                },
              })
            ]);
  
            // Verifica se pelo menos uma das requisições foi bem-sucedida
            const atLeastOneSuccess = responses.some(response => response.status === 'fulfilled');
  
            if (atLeastOneSuccess) {
              message.success('Reserva excluida com sucesso!');
              console.log('Pelo menos uma das reservas foi excluída com sucesso!');
              setRefresh(prev => prev + 1); // Atualiza se pelo menos uma requisição foi bem-sucedida
            } else {
              console.error('Falha ao excluir todas as reservas.');
            }
  
            // Log detalhado para requisições que falharam
            responses.forEach((response, index) => {
              if (response.status === 'rejected') {
                console.error(`Erro ao excluir na requisição ${index + 1}:`, response.reason);
              }
            });
          } else {
            console.error('Você não tem permissão para excluir esta reserva.');
          }
        } catch (error) {
          console.error('Erro ao processar a exclusão:', error);
        }
      }
    );
  };
  
  

  const handleFinalizar = async (record) => {
    showConfirm(
      'Confirmar Finalização',
      'Você tem certeza que deseja finalizar esta reserva?',
      async () => {
        try {
          if (record.id_usuario === Number(userId) && record.status === 5) {
            // Fazendo as requisições para todas as tabelas com Promise.allSettled
            const responses = await Promise.allSettled([
              axios.put(`http://localhost:8080/reservas-labinfo/alterar/${record.id}`, {
                status: 4,
              }, {
                headers: {
                  userId: userId,
                },
              }),
              axios.put(`http://localhost:8080/reservas-sala/alterar/${record.id}`, {
                status: 4,
              }, {
                headers: {
                  userId: userId,
                },
              }),
              axios.put(`http://localhost:8080/reservas-labhab/alterar/${record.id}`, {
                status: 4,
              }, {
                headers: {
                  userId: userId,
                },
              })
            ]);
  
            // Verifica se pelo menos uma das requisições foi bem-sucedida
            const atLeastOneSuccess = responses.some(response => response.status === 'fulfilled');
  
            if (atLeastOneSuccess) {
              message.success('Reserva finalizada com sucesso!');
              console.log('Reserva finalizada com sucesso!');
              setRefresh(prev => prev + 1); // Atualiza se pelo menos uma requisição foi bem-sucedida
            } else {
              console.error('Falha ao finalizar todas as reservas.');
            }
  
            // Log detalhado para requisições que falharam
            responses.forEach((response, index) => {
              if (response.status === 'rejected') {
                console.error(`Erro ao finalizar na requisição ${index + 1}:`, response.reason);
              }
            });
          } else {
            console.error('Você não tem permissão para finalizar esta reserva.');
          }
        } catch (error) {
          console.error('Erro ao finalizar reserva:', error);
        }
      }
    );
  };
  



const filteredDataSource = dataSource.filter(item => 
  // Verifica se algum local foi selecionado e se o valor do laboratório ou tipo_reserva está entre os locais selecionados
  (selectedLocal.length === 0 || selectedLocal.some(local => {
    // Verifica se local é uma string ou um array
    if (Array.isArray(local)) {
      return local.some(subLocal => item.tipo_reserva && subLocal === item.tipo_reserva);
    } else {
      return item.laboratorio === local || item.nome === local;
    }
  })) &&
  
  // Verifica se o status está entre os selecionados
  (selectedStatus.length === 0 || selectedStatus.includes(statusEnum[item.status]))
);


  const totalItems = filteredDataSource.length;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredDataSource.slice(startIndex, startIndex + itemsPerPage);

  const handleLocalChange = (checkedValues) => {
    setSelectedLocal(checkedValues);
  };

  const handleStatusChange = (checkedValues) => {
    setSelectedStatus(checkedValues);
  };

  const clearLocalSelection = () => {
    setSelectedLocal([]);
  };

  const clearStatusSelection = () => {
    setSelectedStatus([]);
  };

  const handleChangePage = (page) => {
    setCurrentPage(page);
  };

  const columns = [
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ marginRight: 8 }}>Local</span>
          <Dropdown
            overlay={
              <Menu>
                {localOptions.map(option => (
                  <Menu.Item key={option.value}>
                    <Checkbox
                      checked={selectedLocal.includes(option.value)}
                      onChange={(e) => {
                        const newSelectedLocal = e.target.checked
                          ? [...selectedLocal, option.value]
                          : selectedLocal.filter(value => value !== option.value);
                        handleLocalChange(newSelectedLocal);
                      }}
                    >
                      {option.label}
                    </Checkbox>
                  </Menu.Item>
                ))}
                <Menu.Item key="clear">
                  <Button type="link" onClick={clearLocalSelection} style={{ padding: 0 }}>
                    Limpar Seleção
                  </Button>
                </Menu.Item>
              </Menu>
            }
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="link">▼</Button>
          </Dropdown>
        </div>
      ),
      dataIndex: 'local',
      key: 'local',
      width: 186,
      align: 'center',
      render: (text, record) => {
        // Verifica de qual tabela a reserva veio e renderiza o texto correspondente
        if (record.nome_tabela === 'reserva_labinfo') {
          return record.nome; 
        } else if (record.nome_tabela === 'reserva_sala') {
          return record.tipo_reserva; 
        }else if (record.nome_tabela === 'reserva_labhab') {
          return record.laboratorio; 
        }
        
        return null; // Retorna null se não houver correspondência
      },
      // sorter: (a, b) => (String(a.status) || '').localeCompare(String(b.status) || '')
    },
    {
      title: (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ marginRight: 8 }}>Status</span>
          <Dropdown
            overlay={
              <Menu>
                {statusOptions.map(option => (
                  <Menu.Item key={option.value}>
                    <Checkbox
                      checked={selectedStatus.includes(option.value)}
                      onChange={(e) => {
                        const newSelectedStatus = e.target.checked
                          ? [...selectedStatus, option.value]
                          : selectedStatus.filter(value => value !== option.value);
                        handleStatusChange(newSelectedStatus);
                      }}
                    >
                      {option.label}
                    </Checkbox>
                  </Menu.Item>
                ))}
                <Menu.Item key="clear">
                  <Button type="link" onClick={clearStatusSelection} style={{ padding: 0 }}>
                    Limpar Seleção
                  </Button>
                </Menu.Item>
              </Menu>
            }
            placement="bottomRight"
            trigger={['click']}
          >
            <Button type="link">▼</Button>
          </Dropdown>
        </div>
      ),
      dataIndex: 'status',
      key: 'status',
      width: 60,
      align: 'center',
      render: (status) =>statusEnum[status],
      sorter: (a, b) => (String(a.status) || '').localeCompare(String(b.status) || '')

    },

    {
      title: 'Local disponibilizado',
      dataIndex: 'local',
      key: 'localesc',
      width: 100,
      align: 'center',
      
    },
    {
      title: 'Disciplina',
      dataIndex: 'disciplina',
      key: 'disciplina',
      width: 60,
      align: 'center',
    },
    {
      title: 'Informação',
      dataIndex: 'informacao', // Pode ser 'software' ou 'equipamentos'
      key: 'informacao',
      width: 60,
      align: 'center',
      render: (text, record) => {
        // Verifica de qual tabela a reserva veio e renderiza o texto correspondente
        if (record.nome_tabela === 'reserva_labinfo') {
          return record.software; // Exibe 'software' para reservas de labinfo
        } else if (record.nome_tabela === 'reserva_sala') {
          return record.equipamentos; // Exibe 'equipamentos' para reservas de sala
        }
        return null; // Retorna null se não houver correspondência
      },
    },
    {
      title: 'Data Inicial',
      dataIndex: 'data',
      key: 'data_inicio',
      width: 120,
      align: 'center',
      render: (text) => moment(text).format('DD-MM-YYYY'), 
    },
    {
      title: 'Data Final',
      dataIndex: 'data',
      key: 'data_fim',
      width: 120,
      align: 'center',
      render: (text) => moment(text).format('DD-MM-YYYY'), 
    },
    {
      title: 'Hora Inicial',
      dataIndex: 'hora_inicio',
      key: 'hora_inicio',
      width: 102,
      align: 'center',
      render: (text) => moment(text, 'HH:mm').format('HH:mm'),
    },
    {
      title: 'Hora Final',
      dataIndex: 'hora_fim',
      key: 'hora_fim',
      width: 102,
      align: 'center',
      render: (text) => moment(text, 'HH:mm').format('HH:mm'),
    },
    {
      title: 'Opções',
      key: 'opcoes',
      render: (_, record) => (
        <Dropdown 
      overlay={
        <Menu>
      <Menu.Item key="edit">
      <Link
  to={`/reserva_${
    record.nome_tabela === 'reserva_labinfo'
      ? 'labin'
      : record.nome_tabela === 'reserva_labhab'
      ? 'labhab'
      : record.nome_tabela === 'reserva_sala'
      ? 'sala'
      : '' // Adicione um fallback caso não corresponda a nenhuma tabela
  }/${record.id}`}
>
  <Button type="link">Editar</Button>
</Link>

</Menu.Item>

          <Menu.Item key="delete">
            <Button 
              type="link" 
              danger 
              onClick={() => handleDelete(record) }
            >
              Excluir
            </Button>
          </Menu.Item>

          <Menu.Item key="alterar">
          {record.status === 5 && (
         <Button 
          type="link" 
          danger
          onClick={() => handleFinalizar(record)}
        >
          Finalizar
          </Button>
  )}
</Menu.Item>

          
        </Menu>
      }
      placement="bottomRight" 
    >
      <Button type="link">...</Button>
    </Dropdown>
      ),
      width: 40,
      align: 'center',
    },
  ];

  return (
    <div>
      <SlideMenu />
      <Header />
      <div className="reservas-title">
        <p>
          <Link to="/reservas">Reservas</Link> &gt; Minhas Reservas
        </p>
        <h1>
          <Link to="/reservas">&#8592; </Link> Minhas Reservas
        </h1>
      </div>

      <Table 
        dataSource={paginatedData} 
        columns={columns} 
        pagination={{
          current: currentPage,
          pageSize: itemsPerPage,
          total: totalItems,
          onChange: handleChangePage,
        }} 
        style={{ 
          margin: '40px 100px', 
          width: '90%' 
        }}
        bordered
      />
    </div>
  );
}

export default MinhasReservas;
