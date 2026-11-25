import React, {
  useState,
  useEffect
} from 'react';

import '../styles/TabelaPrecos.css';


function TabelaPrecos({
  idCostureira,
  modoEdicao = false
}) {

  const usuarioSalvo = (() => {

    try {

      const item =
        localStorage.getItem(
          'usuarioAtelie'
        );


      return (
        item &&
        item !== 'undefined'
          ? JSON.parse(item)
          : {}
      );

    } catch {

      return {};

    }

  })();


  const idEfetivo =
    idCostureira ||
    usuarioSalvo?.id_usuario ||
    usuarioSalvo?.id;


  const [
    precos,
    setPrecos
  ] = useState([]);


  const [
    carregando,
    setCarregando
  ] = useState(true);


  const [
    salvando,
    setSalvando
  ] = useState(false);


  const [
    novoServico,
    setNovoServico
  ] = useState('');


  const [
    novoValor,
    setNovoValor
  ] = useState('');


  const [
    novaCategoria,
    setNovaCategoria
  ] = useState('Ajustes');


  useEffect(() => {

    if (!idEfetivo) {

      setCarregando(false);

      return;

    }


    setCarregando(true);


    fetch(
      `/api/usuarios/${idEfetivo}/tabela-precos`
    )

      .then((res) =>
        res.json()
      )

      .then((data) => {

        setPrecos(
          Array.isArray(data)
            ? data
            : []
        );

      })

      .catch((err) =>
        console.error(
          'Erro ao buscar tabela de preços:',
          err
        )
      )

      .finally(() =>
        setCarregando(false)
      );

  }, [idEfetivo]);


  const handleAdicionarPreco =
    async (e) => {

      e.preventDefault();


      if (
        !novoServico.trim() ||
        !novoValor ||
        !idEfetivo
      ) {
        return;
      }


      setSalvando(true);


      try {

        const response =
          await fetch(
            `/api/usuarios/${idEfetivo}/tabela-precos`,
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  servico:
                    novoServico.trim(),

                  valor:
                    parseFloat(
                      novoValor
                    ),

                  categoria:
                    novaCategoria
                })
            }
          );


        const data =
          await response.json();


        if (!response.ok) {

          throw new Error(
            data.erro ||
            'Erro ao adicionar preço.'
          );

        }


        setPrecos(
          (prev) => [
            ...prev,
            data
          ]
        );


        setNovoServico('');
        setNovoValor('');


      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      } finally {

        setSalvando(false);

      }

    };


  const handleRemover =
    async (idPreco) => {

      if (
        !window.confirm(
          'Deseja realmente remover este serviço da tabela de preços?'
        )
      ) {
        return;
      }


      try {

        const response =
          await fetch(
            `/api/tabela-precos/${idPreco}`,
            {
              method: 'DELETE'
            }
          );


        if (!response.ok) {

          const data =
            await response
              .json()
              .catch(() => ({}));


          throw new Error(
            data.erro ||
            'Erro ao excluir item.'
          );

        }


        setPrecos(
          (prev) =>
            prev.filter(
              (p) =>
                (
                  p.id_preco ||
                  p.id
                ) !== idPreco
            )
        );


      } catch (err) {

        alert(
          `Erro: ${err.message}`
        );

      }

    };


  return (

    <section className="tabela-precos">


      {/* CABEÇALHO */}

      <div className="tabela-precos-header">

        <div>

          <span className="tabela-precos-eyebrow">
            Serviços
          </span>


          <h3>
            Tabela de preços referenciais
          </h3>


          <p>
            Valores base estimados para os
            serviços mais solicitados.
          </p>

        </div>


        {modoEdicao && (

          <span className="tabela-precos-edicao">
            Modo de edição
          </span>

        )}

      </div>


      {/* FORMULÁRIO */}

      {modoEdicao && (

        <form
          className="tabela-precos-form"
          onSubmit={
            handleAdicionarPreco
          }
        >

          <div className="tabela-precos-campo tabela-precos-servico">

            <label>
              Serviço
            </label>


            <input
              type="text"

              placeholder="Ex.: Barra de calça"

              value={
                novoServico
              }

              onChange={(e) =>
                setNovoServico(
                  e.target.value
                )
              }

              required
            />

          </div>


          <div className="tabela-precos-campo">

            <label>
              Valor
            </label>


            <input
              type="number"

              step="0.01"

              min="0"

              placeholder="R$ 0,00"

              value={
                novoValor
              }

              onChange={(e) =>
                setNovoValor(
                  e.target.value
                )
              }

              required
            />

          </div>


          <div className="tabela-precos-campo">

            <label>
              Categoria
            </label>


            <select
              value={
                novaCategoria
              }

              onChange={(e) =>
                setNovaCategoria(
                  e.target.value
                )
              }
            >

              <option value="Ajustes">
                Ajustes
              </option>

              <option value="Consertos">
                Consertos
              </option>

              <option value="Confecção">
                Confecção
              </option>

            </select>

          </div>


          <button
            type="submit"

            className="tabela-precos-adicionar"

            disabled={
              salvando
            }
          >
            {salvando
              ? 'Salvando...'
              : '+ Adicionar'
            }
          </button>

        </form>

      )}


      {/* CONTEÚDO */}

      {carregando ? (

        <div className="tabela-precos-estado">

          <span>
            Carregando tabela de preços...
          </span>

        </div>

      ) : precos.length === 0 ? (

        <div className="tabela-precos-vazia">

          <div className="tabela-precos-vazia-icone">
            R$
          </div>


          <strong>
            Nenhum preço cadastrado
          </strong>


          <p>

            {modoEdicao

              ? 'Use o formulário acima para adicionar seus valores.'

              : 'Clique em "Editar Perfil" para cadastrar seus valores.'
            }

          </p>

        </div>

      ) : (

        <div className="tabela-precos-wrapper">

          <table className="tabela-precos-table">

            <thead>

              <tr>

                <th>
                  Serviço
                </th>

                <th>
                  Categoria
                </th>

                <th>
                  Valor base
                </th>

                {modoEdicao && (

                  <th className="tabela-precos-acao">
                    Ação
                  </th>

                )}

              </tr>

            </thead>


            <tbody>

              {precos.map(
                (item) => {

                  const idItem =
                    item.id_preco ||
                    item.id;


                  return (

                    <tr
                      key={
                        idItem
                      }
                    >

                      <td className="tabela-precos-nome">
                        {item.servico}
                      </td>


                      <td>

                        <span className="tabela-precos-categoria">
                          {item.categoria}
                        </span>

                      </td>


                      <td className="tabela-precos-valor">

                        R${' '}

                        {Number(
                          item.valor ||
                          0
                        )
                          .toFixed(2)
                          .replace(
                            '.',
                            ','
                          )}

                      </td>


                      {modoEdicao && (

                        <td className="tabela-precos-acao">

                          <button
                            type="button"

                            className="tabela-precos-excluir"

                            onClick={() =>
                              handleRemover(
                                idItem
                              )
                            }
                          >
                            Excluir
                          </button>

                        </td>

                      )}

                    </tr>

                  );

                }
              )}

            </tbody>

          </table>

        </div>

      )}

    </section>

  );

}


export default TabelaPrecos;