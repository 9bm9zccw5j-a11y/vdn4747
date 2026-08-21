
      if (idx > -1) {
        const updated = [...prev];
        if (p.unit === "м") {
          const step = minMeters(p);
          updated[idx] = {
            ...updated[idx],
            meters: (updated[idx].meters ?? step) + step,
          };
        } else {
          updated[idx] = { ...updated[idx], quantity: updated[idx].quantity + 1 };
        }
        return updated;
      }
      if (p.unit === "м") {
        return [...prev, { product: p, quantity: 1, meters: minMeters(p) }];
      }
      return [...prev, { product: p, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const totalCount = cart.reduce((s, item) => s + item.quantity, 0);
  const totalSum = cart.reduce((s, item) => s + itemTotal(item), 0);

  const openMenuItem = (key: string) => {
    setMenuOpen(false);
    if (key === "admin") {
      setAdminOpen(true);
      return;
    }
    if (key === "loyalty") {
      setLoyaltyOpen(true);
      return;
    }
    if (key === "plumbers") {
      setPlumbersOpen(true);
      return;
    }
    if (key === "contacts") {
      setTimeout(() => {
        alert(
          "Контакты магазина «Водяной»\n\nАдрес: г. Москва, ул. Сантехническая, д. 15\nТелефон: +7 (900) 123-45-67\nWhatsApp / Telegram: +7 (900) 123-45-67\nE-mail: info@vodyanoy.ru\n\nРежим работы:\nПн–Пт: 09:00 – 19:00\nСб: 10:00 – 17:00\nВс: выходной\n\nДоставка по городу — от 300 ₽, самовывоз бесплатно."
        );
      }, 100);
    }
  };

  const syncSupabaseNow = async () => {
  );
}
