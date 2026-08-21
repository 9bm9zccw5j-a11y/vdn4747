
    });
    setReviewForm({
      authorName: "",
      authorPhone: "",
      rating: 5,
      text: "",
      photos: [],
    });
    setToast("Отзыв опубликован");
    setTimeout(() => setToast(""), 1800);
  };

  return (
                  ) : (
                    <div className="flex h-full items-center justify-center text-teal-600">
                      <span className="text-[22px] font-black">
                        {p.firstName[0]}
                        {p.lastName[0]}
                      </span>
                  
}
