export function comprimirImagem(arquivo, { maxLargura = 1080, qualidade = 0.75 } = {}) {
  return new Promise((resolve, reject) => {
    if (!arquivo || !arquivo.type.startsWith('image/')) {
      reject(new Error('Selecione um arquivo de imagem válido (JPG, PNG ou WebP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erro ao ler a imagem selecionada.'));
    reader.onload = (evento) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Não foi possível processar a imagem.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxLargura || height > maxLargura) {
          if (width > height) {
            height = Math.round((height * maxLargura) / width);
            width = maxLargura;
          } else {
            width = Math.round((width * maxLargura) / height);
            height = maxLargura;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const base64Comprimido = canvas.toDataURL('image/jpeg', qualidade);
        resolve(base64Comprimido);
      };
      img.src = evento.target.result;
    };
    reader.readAsDataURL(arquivo);
  });
}